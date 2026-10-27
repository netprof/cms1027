using System.Net;
using System.Net.Http.Json;
using CMS.API.Models;

namespace CMS.API.Tests;

// A new factory per test keeps the in-memory data isolated
public class AppRolesControllerTests : IDisposable
{
    private readonly CmsApiFactory _factory = new();
    private readonly HttpClient _client;

    public AppRolesControllerTests() => _client = _factory.CreateClient();

    public void Dispose() => _factory.Dispose();

    // ---- List / filter ----

    [Fact]
    public async Task GetAll_ReturnsAllRolesWithUserCount()
    {
        var roles = await _client.GetFromJsonAsync<List<AppRole>>("/api/appRoles");

        Assert.NotNull(roles);
        Assert.Equal(["Admin", "User"], roles.Select(r => r.RoleId));
        Assert.Equal(2, roles.Single(r => r.RoleId == "User").UserCount);
    }

    [Theory]
    [InlineData("admin", new[] { "Admin" })]   // matches RoleId / RoleName
    [InlineData("一般", new[] { "User" })]      // matches Description
    [InlineData("  ", new[] { "Admin", "User" })]
    [InlineData("nothing", new string[0])]
    public async Task Query_FiltersByKeyword(string keyword, string[] expected)
    {
        var roles = await QueryAsync(new AppRoleQuery { Keyword = keyword });

        Assert.Equal(expected, roles.Select(r => r.RoleId));
    }

    [Fact]
    public async Task Query_FiltersByPermissionLevelRange()
    {
        var roles = await QueryAsync(new AppRoleQuery { PermissionLevelFrom = 50, PermissionLevelTo = 100 });

        Assert.Equal(["User"], roles.Select(r => r.RoleId));
    }

    [Fact]
    public async Task Query_WithEmptyBody_ReturnsAll()
    {
        var roles = await QueryAsync(new AppRoleQuery());

        Assert.Equal(2, roles.Count);
    }

    // ---- View ----

    [Fact]
    public async Task GetById_ReturnsRoleWithUsers()
    {
        var role = await _client.GetFromJsonAsync<AppRole>("/api/appRoles/User");

        Assert.NotNull(role);
        Assert.Equal("User", role.RoleName);
        Assert.Equal(100, role.PermissionLevel);
        Assert.Equal(["alice", "bob"], role.Users.Select(u => u.UserId));
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404()
    {
        var res = await _client.GetAsync("/api/appRoles/missing");

        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task GetById_EncodedStringId_IsRouted()
    {
        await _client.PostAsJsonAsync("/api/appRoles", NewRequest("Sales/East"));

        var res = await _client.GetAsync($"/api/appRoles/{Uri.EscapeDataString("Sales/East")}");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    // ---- Add ----

    [Fact]
    public async Task Create_ReturnsCreatedAndPersists()
    {
        var res = await _client.PostAsJsonAsync("/api/appRoles", NewRequest("Editor", ["bob"]));

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        Assert.EndsWith("/api/appRoles/Editor", res.Headers.Location?.ToString());

        var created = await res.Content.ReadFromJsonAsync<AppRole>();
        Assert.Equal("Editor", created!.RoleId);
        Assert.Equal(["bob"], created.Users.Select(u => u.UserId));

        var all = await _client.GetFromJsonAsync<List<AppRole>>("/api/appRoles");
        Assert.Contains(all!, r => r.RoleId == "Editor");
    }

    [Fact]
    public async Task Create_DuplicateRoleId_Returns409()
    {
        var res = await _client.PostAsJsonAsync("/api/appRoles", NewRequest("Admin"));

        Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
    }

    [Theory]
    [InlineData("", "Name")]          // RoleId required
    [InlineData("Editor", "")]        // RoleName required
    public async Task Create_MissingRequiredField_Returns400(string roleId, string roleName)
    {
        var req = NewRequest(roleId);
        req.RoleName = roleName;

        var res = await _client.PostAsJsonAsync("/api/appRoles", req);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Create_TooLongRoleId_Returns400()
    {
        var res = await _client.PostAsJsonAsync("/api/appRoles", NewRequest(new string('x', 201)));

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ---- Edit ----

    [Fact]
    public async Task Update_ChangesFieldsAndUsers()
    {
        var req = new AppRoleRequest
        {
            Pkid = 1, RoleId = "Admin", RoleName = "Super Admin", PermissionLevel = 0,
            Description = "updated", UserIds = ["bob"],
        };

        var res = await _client.PutAsJsonAsync("/api/appRoles", req);
        Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);

        var role = await _client.GetFromJsonAsync<AppRole>("/api/appRoles/Admin");
        Assert.Equal("Super Admin", role!.RoleName);
        Assert.Equal(0, role.PermissionLevel);
        Assert.Equal("updated", role.Description);
        Assert.Equal(["bob"], role.Users.Select(u => u.UserId));
    }

    [Fact]
    public async Task Update_UnknownRole_Returns404()
    {
        var res = await _client.PutAsJsonAsync("/api/appRoles", NewRequest("missing"));

        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Update_MissingRoleName_Returns400()
    {
        var req = NewRequest("Admin");
        req.RoleName = "";

        var res = await _client.PutAsJsonAsync("/api/appRoles", req);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ---- Delete ----

    [Fact]
    public async Task Delete_RemovesRole()
    {
        var res = await _client.DeleteAsync("/api/appRoles/User");
        Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);

        var get = await _client.GetAsync("/api/appRoles/User");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task Delete_UnknownRole_Returns404()
    {
        var res = await _client.DeleteAsync("/api/appRoles/missing");

        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    // ---- Lookup / infrastructure ----

    [Fact]
    public async Task LookupAppUsers_ReturnsUsers()
    {
        var users = await _client.GetFromJsonAsync<List<AppUserLookup>>("/api/lookups/appUsers");

        Assert.Equal(["alice", "bob"], users!.Select(u => u.UserId));
    }

    [Fact]
    public async Task Cors_AllowsLocalhostOrigin()
    {
        var msg = new HttpRequestMessage(HttpMethod.Get, "/api/appRoles");
        msg.Headers.Add("Origin", "http://localhost:4200");

        var res = await _client.SendAsync(msg);

        Assert.Equal("http://localhost:4200", res.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task Cors_RejectsOtherOrigin()
    {
        var msg = new HttpRequestMessage(HttpMethod.Get, "/api/appRoles");
        msg.Headers.Add("Origin", "http://evil.example.com");

        var res = await _client.SendAsync(msg);

        Assert.False(res.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Swagger_DocumentIsServed()
    {
        var res = await _client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    private async Task<List<AppRole>> QueryAsync(AppRoleQuery query)
    {
        var res = await _client.PostAsJsonAsync("/api/appRoles/query", query);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<List<AppRole>>())!;
    }

    private static AppRoleRequest NewRequest(string roleId, List<string>? userIds = null) => new()
    {
        RoleId = roleId, RoleName = "Name", PermissionLevel = 100, Description = "desc", UserIds = userIds ?? [],
    };
}
