using CMS.API.Repositories;
using CMS.API.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CMS.API.Tests;

// Hosts the real API pipeline with in-memory repositories (no database needed)
public class CmsApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAppRoleRepository>();
            services.RemoveAll<ILookupRepository>();
            services.AddSingleton<IAppRoleRepository, InMemoryAppRoleRepository>();
            services.AddSingleton<ILookupRepository, InMemoryLookupRepository>();
        });
    }
}
