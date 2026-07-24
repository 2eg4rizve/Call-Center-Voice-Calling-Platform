using System.Reflection;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CallCenter.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(
            configuration => { },
            Assembly.GetExecutingAssembly());
        services.AddScoped<IAgentService, AgentService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICallAssignmentService, CallAssignmentService>();
        services.AddScoped<ICallQueueService, CallQueueService>();
        services.AddScoped<ICallService, CallService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
