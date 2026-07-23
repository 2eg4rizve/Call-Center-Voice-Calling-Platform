using CallCenter.Domain.Enums;

namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class AgentSummaryResponseDto
{
    public Guid Id { get; init; }

    public string DisplayName { get; init; } = string.Empty;

    public AgentStatus Status { get; init; }

    public DateTimeOffset? LastAvailableAtUtc { get; init; }

    public string? CurrentCallReference { get; init; }
}
