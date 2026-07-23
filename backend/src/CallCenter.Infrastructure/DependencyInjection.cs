using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Infrastructure.Persistence;
using CallCenter.Infrastructure.Persistence.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Infrastructure.Identity;
using CallCenter.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CallCenter.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("CallCenterDatabase")
            ?? throw new InvalidOperationException(
                "Connection string 'CallCenterDatabase' is not configured.");

        services.AddDbContext<CallCenterDbContext>(options =>
            options.UseSqlServer(connectionString));

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(options =>
        {
            options.Issuer = jwtSection["Issuer"] ?? string.Empty;
            options.Audience = jwtSection["Audience"] ?? string.Empty;
            options.Key = jwtSection["Key"] ?? string.Empty;
            options.ExpiryMinutes = int.TryParse(jwtSection["ExpiryMinutes"], out var minutes) ? minutes : 60;
        });
        services.AddIdentityCore<ApplicationUser>(options => options.Password.RequiredLength = 8)
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<CallCenterDbContext>();

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAgentService, AgentService>();

        return services;
    }
}
