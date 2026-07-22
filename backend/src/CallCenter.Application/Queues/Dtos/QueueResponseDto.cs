namespace CallCenter.Application.Queues.Dtos;

public sealed class QueueResponseDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public bool IsActive { get; init; }
}
