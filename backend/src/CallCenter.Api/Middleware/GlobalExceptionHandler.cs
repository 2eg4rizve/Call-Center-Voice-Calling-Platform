using Microsoft.Data.SqlClient;
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
        if (exception is OperationCanceledException && httpContext.RequestAborted.IsCancellationRequested)
        {
            logger.LogDebug("Request {TraceIdentifier} was cancelled by the client.", httpContext.TraceIdentifier);
            httpContext.Response.StatusCode = 499;
            return true;
        }

        var error = exception switch
        {
            ArgumentException => new ApiError(StatusCodes.Status400BadRequest, "invalid_request", "Invalid request.", exception.Message),
            UnauthorizedAccessException => new ApiError(StatusCodes.Status401Unauthorized, "unauthorized", "Unauthorized.", exception.Message),
            KeyNotFoundException => new ApiError(StatusCodes.Status404NotFound, "not_found", "Resource not found.", exception.Message),
            DbUpdateConcurrencyException => new ApiError(StatusCodes.Status409Conflict, "concurrency_conflict", "Workflow conflict.", "The resource changed while the request was being processed. Refresh and try again."),
            DbUpdateException => new ApiError(StatusCodes.Status409Conflict, "database_conflict", "Database conflict.", "The requested change conflicts with the current data. Refresh and try again."),
            InvalidOperationException => new ApiError(StatusCodes.Status409Conflict, "workflow_conflict", "Workflow conflict.", exception.Message),
            SqlException sqlException when sqlException.Number == -2 => new ApiError(StatusCodes.Status503ServiceUnavailable, "database_timeout", "Service temporarily unavailable.", "The database did not respond in time. Please try again."),
            SqlException => new ApiError(StatusCodes.Status503ServiceUnavailable, "database_unavailable", "Service temporarily unavailable.", "The database is temporarily unavailable. Please try again."),
            TimeoutException => new ApiError(StatusCodes.Status503ServiceUnavailable, "service_timeout", "Service temporarily unavailable.", "The operation did not complete in time. Please try again."),
            OperationCanceledException => new ApiError(StatusCodes.Status408RequestTimeout, "request_timeout", "Request timed out.", "The request could not be completed in time. Please try again."),
            _ => new ApiError(StatusCodes.Status500InternalServerError, "unexpected_error", "An unexpected error occurred.", "The server could not complete the request.")
        };

        if (error.Status == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "An unhandled exception occurred while processing the request.");
        else if (error.Status >= StatusCodes.Status500InternalServerError)
            logger.LogWarning(exception, "A temporary dependency failure returned status {StatusCode}.", error.Status);
        else
            logger.LogInformation("Request returned status {StatusCode}: {Message}", error.Status, error.Detail);

        httpContext.Response.StatusCode = error.Status;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = error.Status,
                Title = error.Title,
                Detail = error.Detail,
                Extensions =
                {
                    ["code"] = error.Code,
                    ["traceId"] = httpContext.TraceIdentifier
                }
            }
        });
    }

    private sealed record ApiError(int Status, string Code, string Title, string Detail);
}
