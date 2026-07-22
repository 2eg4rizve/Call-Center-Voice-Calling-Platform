using CallCenter.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Calls.Dtos;

public sealed class CallHistoryRequestDto
{
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;

    public string? PhoneNumber { get; init; }

    public Guid? AgentId { get; init; }

    public CallStatus? Status { get; init; }

    public CallOutcome? Outcome { get; init; }

    public DateOnly? FromDate { get; init; }

    public DateOnly? ToDate { get; init; }
}
