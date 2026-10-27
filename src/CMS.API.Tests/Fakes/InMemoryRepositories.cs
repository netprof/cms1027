using CMS.API.Models;
using CMS.API.Repositories;

namespace CMS.API.Tests.Fakes;

public class InMemoryLookupRepository : ILookupRepository
{
    public static readonly List<AppUserLookup> Users =
    [
        new() { Pkid = 1, UserId = "alice", UserName = "Alice" },
        new() { Pkid = 2, UserId = "bob", UserName = "Bob" },
    ];

    public Task<IEnumerable<AppUserLookup>> GetAppUsersAsync() => Task.FromResult<IEnumerable<AppUserLookup>>(Users);
}

// Mirrors the SQL behaviour of AppRoleRepository against an in-memory list
public class InMemoryAppRoleRepository : IAppRoleRepository
{
    private readonly List<(AppRole Role, List<string> UserIds)> _rows = [];
    private int _nextPkid = 1;

    public InMemoryAppRoleRepository()
    {
        Add(new AppRoleRequest { RoleId = "Admin", RoleName = "Administrator", PermissionLevel = 1, Description = "系統管理員", UserIds = ["alice"] });
        Add(new AppRoleRequest { RoleId = "User", RoleName = "User", PermissionLevel = 100, Description = "一般使用者", UserIds = ["alice", "bob"] });
    }

    public Task<IEnumerable<AppRole>> GetAllAsync()
        => Task.FromResult(_rows.OrderBy(r => r.Role.RoleId).Select(r => ToModel(r, false)));

    public Task<IEnumerable<AppRole>> QueryAsync(AppRoleQuery q)
    {
        var kw = q.Keyword?.Trim();
        var result = _rows
            .Where(r => string.IsNullOrEmpty(kw)
                || r.Role.RoleId.Contains(kw, StringComparison.OrdinalIgnoreCase)
                || r.Role.RoleName.Contains(kw, StringComparison.OrdinalIgnoreCase)
                || (r.Role.Description?.Contains(kw, StringComparison.OrdinalIgnoreCase) ?? false))
            .Where(r => q.PermissionLevelFrom is null || r.Role.PermissionLevel >= q.PermissionLevelFrom)
            .Where(r => q.PermissionLevelTo is null || r.Role.PermissionLevel <= q.PermissionLevelTo)
            .OrderBy(r => r.Role.RoleId)
            .Select(r => ToModel(r, false));
        return Task.FromResult(result);
    }

    public Task<AppRole?> GetByIdAsync(string roleId)
    {
        var row = Find(roleId);
        return Task.FromResult(row is null ? null : ToModel(row.Value, true));
    }

    public Task<bool> ExistsAsync(string roleId) => Task.FromResult(Find(roleId) is not null);

    public Task<AppRole> CreateAsync(AppRoleRequest request) => Task.FromResult(ToModel(Add(request), true));

    public Task<bool> UpdateAsync(AppRoleRequest request)
    {
        var index = _rows.FindIndex(r => Same(r.Role.RoleId, request.RoleId));
        if (index < 0) return Task.FromResult(false);

        var role = _rows[index].Role;
        role.RoleName = request.RoleName;
        role.PermissionLevel = request.PermissionLevel;
        role.Description = request.Description;
        _rows[index] = (role, request.UserIds.Distinct().ToList());
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(string roleId)
        => Task.FromResult(_rows.RemoveAll(r => Same(r.Role.RoleId, roleId)) > 0);

    private (AppRole, List<string>) Add(AppRoleRequest req)
    {
        var row = (new AppRole
        {
            Pkid = _nextPkid++,
            RoleId = req.RoleId,
            RoleName = req.RoleName,
            PermissionLevel = req.PermissionLevel,
            Description = req.Description,
        }, req.UserIds.Distinct().ToList());
        _rows.Add(row);
        return row;
    }

    private (AppRole Role, List<string> UserIds)? Find(string roleId)
        => _rows.Cast<(AppRole Role, List<string> UserIds)?>().FirstOrDefault(r => Same(r!.Value.Role.RoleId, roleId));

    // SQL Server default collation is case-insensitive
    private static bool Same(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    private static AppRole ToModel((AppRole Role, List<string> UserIds) row, bool withUsers) => new()
    {
        Pkid = row.Role.Pkid,
        RoleId = row.Role.RoleId,
        RoleName = row.Role.RoleName,
        PermissionLevel = row.Role.PermissionLevel,
        Description = row.Role.Description,
        UserCount = row.UserIds.Count,
        Users = withUsers
            ? InMemoryLookupRepository.Users.Where(u => row.UserIds.Contains(u.UserId)).ToList()
            : [],
    };
}
