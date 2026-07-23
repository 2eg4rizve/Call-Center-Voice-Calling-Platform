using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Infrastructure.Persistence;
using CallCenter.Infrastructure.Persistence.Repositories;
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

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
