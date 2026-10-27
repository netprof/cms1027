# CMS

| 專案 | 技術 | 位址 |
|------|------|------|
| `CMS.API` | .NET 9 Web API、Dapper、Swagger | http://localhost:5000（Swagger：`/swagger`） |
| `CMS.API.Tests` | xUnit、WebApplicationFactory（使用 in-memory repository，不需資料庫） | — |
| `CMS.NG` | Angular 20（standalone）、PrimeNG 20 | http://localhost:4200 |

## 執行

```powershell
# 後端
dotnet run --project src/CMS.API --launch-profile http

# 前端
cd src/CMS.NG
npm start
```

連線字串在 `CMS.API/appsettings.json` 的 `ConnectionStrings:CMS`。
前端 API 位址在 `CMS.NG/src/environments/environment*.ts`，以 `@env/environment` 匯入。

## 測試

```powershell
dotnet test src/CMS.sln

cd src/CMS.NG
npx ng test              # 監看模式
npx ng test --watch=false --browsers=ChromeHeadless
```
