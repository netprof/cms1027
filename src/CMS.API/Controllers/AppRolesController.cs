using CMS.API.Models;
using CMS.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CMS.API.Controllers;

[ApiController]
[Route("api/appRoles")]
public class AppRolesController(IAppRoleRepository repo) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppRole>>> GetAll()
        => Ok(await repo.GetAllAsync());

    [HttpPost("query")]
    public async Task<ActionResult<IEnumerable<AppRole>>> Query(AppRoleQuery query)
        => Ok(await repo.QueryAsync(query));

    // String PK: no :int constraint
    [HttpGet("{id}")]
    public async Task<ActionResult<AppRole>> GetById(string id)
    {
        var role = await repo.GetByIdAsync(DecodeId(id));
        return role is null ? NotFound() : Ok(role);
    }

    [HttpPost]
    public async Task<ActionResult<AppRole>> Create(AppRoleRequest request)
    {
        if (await repo.ExistsAsync(request.RoleId))
            return Conflict(new { message = $"角色代碼 '{request.RoleId}' 已存在" });

        var created = await repo.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.RoleId }, created);
    }

    [HttpPut]
    public async Task<IActionResult> Update(AppRoleRequest request)
        => await repo.UpdateAsync(request) ? NoContent() : NotFound();

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
        => await repo.DeleteAsync(DecodeId(id)) ? NoContent() : NotFound();

    // Routing leaves %2F encoded in route values; client sends encodeURIComponent(id)
    private static string DecodeId(string id) => Uri.UnescapeDataString(id);
}
