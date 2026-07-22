using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CallCenter.Api.HealthChecks;

internal static class HealthCheckResponseWriter
{
    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration.TotalMilliseconds
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
