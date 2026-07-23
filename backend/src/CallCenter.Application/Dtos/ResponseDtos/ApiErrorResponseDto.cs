namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class ApiErrorResponseDto
{
    public int StatusCode { get; init; }

    public string Code { get; init; } = string.Empty;

    public string Message { get; init; } = string.Empty;

    public string? Detail { get; init; }

    public string? TraceId { get; init; }

    public IReadOnlyDictionary<string, string[]>? ValidationErrors { get; init; }
}
