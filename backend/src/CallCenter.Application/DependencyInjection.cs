using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace CallCenter.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(
            configuration => { },
            Assembly.GetExecutingAssembly());

        return services;
    }
}
