using CallCenter.Application.Customers.Dtos;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Calls.Dtos;

public sealed class AssignedCallResponseDto
{
    public Guid Id { get; init; }

    public string CallReferenceNumber { get; init; } = string.Empty;

    public CallStatus Status { get; init; }

    public string CallerPhoneNumber { get; init; } = string.Empty;

    public Guid QueueId { get; init; }

    public string QueueName { get; init; } = string.Empty;

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset? AssignedAt { get; init; }

    public CustomerResponseDto? Customer { get; init; }
}
