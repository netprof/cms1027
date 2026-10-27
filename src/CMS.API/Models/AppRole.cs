namespace CMS.API.Models;

public class AppRole
{
    public int Pkid { get; set; }
    public string RoleId { get; set; } = "";
    public string RoleName { get; set; } = "";
    public int PermissionLevel { get; set; }
    public string? Description { get; set; }

    // n-n AppUserRole: count for list, full list for single record
    public int UserCount { get; set; }
    public List<AppUserLookup> Users { get; set; } = [];
}
