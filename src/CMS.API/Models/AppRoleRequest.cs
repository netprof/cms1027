using System.ComponentModel.DataAnnotations;

namespace CMS.API.Models;

public class AppRoleRequest
{
    public int Pkid { get; set; }

    [Required, StringLength(200)]
    public string RoleId { get; set; } = "";

    [Required, StringLength(200)]
    public string RoleName { get; set; } = "";

    public int PermissionLevel { get; set; } = 100;

    [StringLength(400)]
    public string? Description { get; set; }

    // n-n AppUserRole (AppUser key is the string UserId)
    public List<string> UserIds { get; set; } = [];
}
