using CallCenter.Application.Agents.Dtos;
using CallCenter.Application.Customers.Dtos;
using CallCenter.Application.CallQueues.Dtos;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Calls.Dtos;

public sealed class CallDetailsResponseDto
{
    public Guid Id { get; init; }

    public string CallReferenceNumber { get; init; } = string.Empty;

    public CallDirection Direction { get; init; }

    public CallStatus Status { get; init; }

    public string CallerPhoneNumber { get; init; } = string.Empty;

    public CustomerResponseDto? Customer { get; init; }

    public CallQueueResponseDto CallQueue { get; init; } = new();

    public AgentSummaryResponseDto? AssignedAgent { get; init; }

    public DateTimeOffset CreatedAtUtc { get; init; }

    public DateTimeOffset? AssignedAtUtc { get; init; }

    public DateTimeOffset? AcceptedAtUtc { get; init; }

    public DateTimeOffset? CompletedAtUtc { get; init; }

    public int? DurationSeconds { get; init; }

    public CallOutcome? Outcome { get; init; }

    public string? Notes { get; init; }

    public CrmSyncStatus CrmSyncStatus { get; init; }

    public IReadOnlyCollection<CallEventResponseDto> Events { get; init; } = [];
}
