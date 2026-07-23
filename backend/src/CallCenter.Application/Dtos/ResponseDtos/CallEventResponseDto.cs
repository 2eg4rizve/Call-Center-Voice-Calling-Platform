using CallCenter.Domain.Enums;

namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class CallEventResponseDto
{
    public Guid Id { get; init; }

    public CallEventType EventType { get; init; }

    public DateTimeOffset EventAtUtc { get; init; }

    public string? Details { get; init; }
}
