# CMS

Full-stack CMS generated from an existing SQL Server schema.

## Layout

| Path | Content |
|------|---------|
| `database/*.sql` | Source schema (read-only reference; do not run against the DB) |
| `spec/code-gen.convention.md` | **Code generation rules — follow for every new feature** |
| `spec/feature-spec.template.md`, `spec/sample*.spec.md` | Per-table feature spec format |
| `spec/ui-sample-*.png` | UI style reference only (layout, colors) — not content |
| `src/CMS.API` | .NET 9 Web API, Dapper (no EF), Swagger at `/swagger`, port 5000 |
| `src/CMS.API.Tests` | xUnit, `WebApplicationFactory<Program>` + in-memory fake repositories |
| `src/CMS.NG` | Angular 20 standalone, PrimeNG 20 (Aura preset, emerald primary), port 4200 |

## Commands

```powershell
dotnet run --project src/CMS.API --launch-profile http     # http://localhost:5000/swagger
dotnet test src/CMS.sln

cd src/CMS.NG
npm start                                                  # http://localhost:4200
npx ng test --watch=false --browsers=ChromeHeadless
npx ng build
```

## Database

- Connection string `ConnectionStrings:CMS` in `src/CMS.API/appsettings.json`: `Server=.` (default instance, **not** `.\SQLEXPRESS` — that instance does not exist on this machine).
- Database `CMS` has live data. Verify write SQL inside `BEGIN TRAN … ROLLBACK`; do not leave test rows.

## Backend conventions (in addition to the spec)

- Per table: `Models/{T}.cs`, `{T}Request.cs`, `{T}Query.cs`; `Repositories/I{T}Repository.cs` + `{T}Repository.cs`; `Controllers/{T}sController.cs` at `api/{camelPlural}` (e.g. `api/appRoles`).
- Slim lookups for FK / n-n targets go in `LookupRepository` + `LookupsController` (`GET api/lookups/{plural}`).
- `IDbConnectionFactory.OpenAsync()` gives an open connection; write n-n changes in one transaction (delete-then-reinsert).
- String PK routes: decode with `Uri.UnescapeDataString(id)` — ASP.NET Core leaves `%2F` encoded in route values, so the client's `encodeURIComponent(id)` would otherwise 404 for ids containing `/`.
- Validation: DataAnnotations on the Request DTO (`[Required]`, `[StringLength]` from column sizes); `[ApiController]` returns 400 automatically. Duplicate key on create → 409 with `{ message }`.
- Nullable columns are optional in the API and form, even if a UI sample marks them required.
- Tests: register a fake in `CmsApiFactory` per repository; the fake should mirror SQL behaviour (case-insensitive keys, keyword `LIKE` on the same columns).

## Frontend conventions (in addition to the spec)

- API base URL from `@env/environment` (`tsconfig.json` path alias); no dev-server proxy.
- Feature folder `src/app/features/{table-plural}/` holds `{table}.model.ts`, `{table}.service.ts` and the list / detail / form components. Shared code in `src/app/core/` (`LookupService`, `session-store.ts`, `api-error.ts`).
- Routes: `/{plural}`, `/{plural}/new`, `/{plural}/:id`, `/{plural}/:id/edit`; route params bound to `input()` via `withComponentInputBinding()`.
- Navigation buttons must be real links: use `<a pButton [routerLink]>` with `pButtonIcon` / `pButtonLabel` children, not `<p-button [routerLink]>` (no `href`, cannot open in new tab).
- `MessageService` is provided app-wide (`<p-toast>` in `app.html`); `ConfirmationService` is provided per list component.
- Sidebar entries: `navGroups` in `src/app/app.ts`.
- UI text is Traditional Chinese (Taiwan).

## Features

| Feature | Table | Notes |
|---------|-------|-------|
| 角色 AppRole (系統管理 Admin) | `AppRole` (PK `RoleId` nvarchar), n-n `AppUserRole` → `AppUser` | List filter: keyword (RoleId/RoleName/Description) + PermissionLevel range. `RoleId` is read-only on edit. Request uses `UserIds: List<string>` (the junction keys on string `UserId`, so not `List<int>`). Delete also removes `AppUserRole` rows. |

## Environment notes

- Windows; Git Bash and PowerShell 5.1 both available. In Git Bash, `\\` inside test JSON passed on stdin gets collapsed — write test payloads to files instead.
- PowerShell execution policy is `RemoteSigned` (CurrentUser); local scripts run without `-ExecutionPolicy Bypass`.
- Angular CLI installed globally is v22; use the project-local CLI (`npx ng`) for this Angular 20 project.
