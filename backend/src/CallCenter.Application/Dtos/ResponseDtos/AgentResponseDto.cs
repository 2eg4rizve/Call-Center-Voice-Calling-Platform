using CallCenter.Domain.Enums;

namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class AgentResponseDto
{
    public Guid Id { get; init; }

    public string DisplayName { get; init; } = string.Empty;

    public AgentStatus Status { get; init; }

    public DateTimeOffset? LastAvailableAtUtc { get; init; }

    public IReadOnlyCollection<string> CallQueueNames { get; init; } = [];
}
