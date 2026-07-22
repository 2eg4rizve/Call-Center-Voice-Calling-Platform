using CallCenter.Domain.Enums;

namespace CallCenter.Application.Agents.Dtos;

public sealed class AgentResponseDto
{
    public Guid Id { get; init; }

    public string IdentityUserId { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public AgentStatus Status { get; init; }

    public DateTimeOffset? LastAvailableAt { get; init; }

    public Guid? CurrentActiveCallId { get; init; }

    public IReadOnlyCollection<Guid> QueueIds { get; init; } = [];
}
