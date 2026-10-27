# CMS

Full-stack CMS generated from a SQL Server schema. Setup and background: [docs/setup-notes.md](docs/setup-notes.md).

## Layout

- `database/*.sql`: schema, read-only reference
- `spec/code-gen.convention.md`: **code-gen rules for every feature**; `spec/ui-sample-*.png` is style only
- `src/CMS.API`: .NET 9, Dapper (no EF), port 5000; `src/CMS.API.Tests`: xUnit
- `src/CMS.NG`: Angular 20 standalone + PrimeNG 20, port 4200

## Commands

```powershell
dotnet run --project src/CMS.API --launch-profile http
dotnet test src/CMS.sln
cd src/CMS.NG; npm start
npx ng test --watch=false --browsers=ChromeHeadless
```

## Rules

- DB `CMS` has live data: verify write SQL in `BEGIN TRAN … ROLLBACK`.
- Per table: `Models/{T}`, `{T}Request`, `{T}Query`; `I{T}Repository` + `{T}Repository`; `{T}sController` at `api/{camelPlural}`. Lookups: `LookupRepository` / `LookupsController`.
- n-n writes: one transaction, delete-then-reinsert.
- String PK routes: decode with `Uri.UnescapeDataString(id)`.
- DataAnnotations from column sizes; duplicate key → 409 `{ message }`. Nullable columns are optional.
- Tests: one fake per repository in `CmsApiFactory`, mirroring SQL (case-insensitive keys, same `LIKE` columns).
- Frontend: feature folder `src/app/features/{plural}/`; shared code in `src/app/core/`; routes `/{plural}`, `/new`, `/:id`, `/:id/edit` bound to `input()`.
- Nav buttons: `<a pButton [routerLink]>`, not `<p-button [routerLink]>`.
- Sidebar: `navGroups` in `src/app/app.ts`. UI text: zh-TW.

## Features

- AppRole (Admin): filter keyword + PermissionLevel range; `RoleId` read-only on edit; `UserIds: List<string>`; delete removes `AppUserRole` rows.
