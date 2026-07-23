using CallCenter.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class CallHistoryRequestDto
{
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;

    public Guid? AgentId { get; init; }

    [StringLength(200)]
    public string? CustomerSearch { get; init; }

    public CallStatus? Status { get; init; }

    public CallOutcome? Outcome { get; init; }

    public DateTimeOffset? FromDateUtc { get; init; }

    public DateTimeOffset? ToDateUtc { get; init; }
}
