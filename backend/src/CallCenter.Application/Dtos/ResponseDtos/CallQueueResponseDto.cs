namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class CallQueueResponseDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string? Description { get; init; }

    public bool IsActive { get; init; }
}
