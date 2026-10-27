using System.Data;
using CMS.API.Data;
using CMS.API.Models;
using Dapper;

namespace CMS.API.Repositories;

public class AppRoleRepository(IDbConnectionFactory db) : IAppRoleRepository
{
    private const string SelectSql = """
        SELECT r.pkid AS Pkid, r.RoleId, r.RoleName, r.PermissionLevel, r.Description,
               (SELECT COUNT(*) FROM AppUserRole ur WHERE ur.RoleId = r.RoleId) AS UserCount
        FROM AppRole r
        """;

    public async Task<IEnumerable<AppRole>> GetAllAsync()
    {
        using var conn = await db.OpenAsync();
        return await conn.QueryAsync<AppRole>($"{SelectSql} ORDER BY r.RoleId");
    }

    public async Task<IEnumerable<AppRole>> QueryAsync(AppRoleQuery query)
    {
        var where = new List<string>();
        var p = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            where.Add("(r.RoleId LIKE @Keyword OR r.RoleName LIKE @Keyword OR r.Description LIKE @Keyword)");
            p.Add("Keyword", $"%{query.Keyword.Trim()}%");
        }
        if (query.PermissionLevelFrom.HasValue)
        {
            where.Add("r.PermissionLevel >= @PermissionLevelFrom");
            p.Add("PermissionLevelFrom", query.PermissionLevelFrom);
        }
        if (query.PermissionLevelTo.HasValue)
        {
            where.Add("r.PermissionLevel <= @PermissionLevelTo");
            p.Add("PermissionLevelTo", query.PermissionLevelTo);
        }

        var sql = SelectSql
            + (where.Count > 0 ? " WHERE " + string.Join(" AND ", where) : "")
            + " ORDER BY r.RoleId";

        using var conn = await db.OpenAsync();
        return await conn.QueryAsync<AppRole>(sql, p);
    }

    public async Task<AppRole?> GetByIdAsync(string roleId)
    {
        using var conn = await db.OpenAsync();
        var role = await conn.QuerySingleOrDefaultAsync<AppRole>(
            $"{SelectSql} WHERE r.RoleId = @roleId", new { roleId });
        if (role is null) return null;

        role.Users = (await conn.QueryAsync<AppUserLookup>("""
            SELECT u.pkid AS Pkid, u.UserId, u.UserName
            FROM AppUserRole ur
            JOIN AppUser u ON u.UserId = ur.UserId
            WHERE ur.RoleId = @roleId
            ORDER BY u.UserId
            """, new { roleId })).ToList();
        return role;
    }

    public async Task<bool> ExistsAsync(string roleId)
    {
        using var conn = await db.OpenAsync();
        return await conn.ExecuteScalarAsync<bool>(
            "SELECT CASE WHEN EXISTS (SELECT 1 FROM AppRole WHERE RoleId = @roleId) THEN 1 ELSE 0 END",
            new { roleId });
    }

    public async Task<AppRole> CreateAsync(AppRoleRequest request)
    {
        using var conn = await db.OpenAsync();
        using var tx = conn.BeginTransaction();

        await conn.ExecuteAsync("""
            INSERT INTO AppRole (RoleId, RoleName, PermissionLevel, Description)
            VALUES (@RoleId, @RoleName, @PermissionLevel, @Description)
            """, request, tx);
        await ReplaceUsersAsync(conn, tx, request.RoleId, request.UserIds);

        tx.Commit();
        return (await GetByIdAsync(request.RoleId))!;
    }

    public async Task<bool> UpdateAsync(AppRoleRequest request)
    {
        using var conn = await db.OpenAsync();
        using var tx = conn.BeginTransaction();

        // RoleId is the PK (and FK target), so it cannot change
        var rows = await conn.ExecuteAsync("""
            UPDATE AppRole
            SET RoleName = @RoleName, PermissionLevel = @PermissionLevel, Description = @Description
            WHERE RoleId = @RoleId
            """, request, tx);
        if (rows == 0) return false;

        await ReplaceUsersAsync(conn, tx, request.RoleId, request.UserIds);
        tx.Commit();
        return true;
    }

    public async Task<bool> DeleteAsync(string roleId)
    {
        using var conn = await db.OpenAsync();
        using var tx = conn.BeginTransaction();

        await conn.ExecuteAsync("DELETE FROM AppUserRole WHERE RoleId = @roleId", new { roleId }, tx);
        var rows = await conn.ExecuteAsync("DELETE FROM AppRole WHERE RoleId = @roleId", new { roleId }, tx);

        tx.Commit();
        return rows > 0;
    }

    // n-n: delete-then-reinsert
    private static async Task ReplaceUsersAsync(IDbConnection conn, IDbTransaction tx, string roleId, List<string> userIds)
    {
        await conn.ExecuteAsync("DELETE FROM AppUserRole WHERE RoleId = @roleId", new { roleId }, tx);
        if (userIds.Count == 0) return;

        await conn.ExecuteAsync(
            "INSERT INTO AppUserRole (UserId, RoleId) VALUES (@UserId, @RoleId)",
            userIds.Distinct().Select(userId => new { UserId = userId, RoleId = roleId }), tx);
    }
}
