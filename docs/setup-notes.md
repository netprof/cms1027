# Setup notes

Machine setup and background context moved out of `CLAUDE.md`.

## Database

- Connection string `ConnectionStrings:CMS` in `src/CMS.API/appsettings.json` uses `Server=.` (default instance). Do **not** use `.\SQLEXPRESS`: that instance does not exist on this machine.
- `IDbConnectionFactory.OpenAsync()` returns an open connection.

## Environment

- Windows; Git Bash and PowerShell 5.1 are both available. In Git Bash, `\\` inside test JSON passed on stdin gets collapsed. Write test payloads to files instead.
- PowerShell execution policy is `RemoteSigned` (CurrentUser). Local scripts run without `-ExecutionPolicy Bypass`.
- The globally installed Angular CLI is v22. Use the project-local CLI (`npx ng`) for this Angular 20 project.
- Swagger UI: http://localhost:5000/swagger. Frontend: http://localhost:4200.

## Stack details

- `src/CMS.API.Tests` uses `WebApplicationFactory<Program>` with in-memory fake repositories.
- `src/CMS.NG` uses PrimeNG 20 with the Aura preset and an emerald primary color. No dev-server proxy; the API base URL comes from the `@env/*` path alias in `tsconfig.json`.
- `MessageService` is provided app-wide (`<p-toast>` in `app.html`). `ConfirmationService` is provided per list component.
- Spec format for each table: `spec/feature-spec.template.md`, `spec/sample*.spec.md`.

## Why some rules exist

- **`Uri.UnescapeDataString(id)` on string PK routes:** ASP.NET Core leaves `%2F` encoded in route values. Without decoding, the client's `encodeURIComponent(id)` returns 404 for ids that contain `/`.
- **`<a pButton [routerLink]>` instead of `<p-button [routerLink]>`:** `p-button` renders no `href`, so the link cannot open in a new tab.
- **`[ApiController]`** returns 400 automatically when DataAnnotations validation fails.
- **AppRole `UserIds: List<string>`:** the `AppUserRole` junction keys on the string `UserId`, not on the int PK.
