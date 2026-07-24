using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Workflow conflict.", "The resource changed while the request was being processed. Refresh and try again."),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Workflow conflict.", exception.Message),
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
