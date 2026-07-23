using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace CallCenter.Api.Middleware;

internal sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title, detail) = exception switch
        {
            ArgumentException => (StatusCodes.Status400BadRequest, "Invalid request.", exception.Message),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized.", exception.Message),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found.", exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.", "The server could not complete the request.")
        };

        if (status >= StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "An unhandled exception occurred while processing the request.");
        else
            logger.LogWarning("Request failed with status {StatusCode}: {Message}", status, exception.Message);

        httpContext.Response.StatusCode = status;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = detail
            }
        });
    }
}
