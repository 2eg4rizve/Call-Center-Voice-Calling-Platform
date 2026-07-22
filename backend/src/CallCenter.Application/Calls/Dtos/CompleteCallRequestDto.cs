using CallCenter.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Calls.Dtos;

public sealed class CompleteCallRequestDto
{
    [Required]
    public CallOutcome? Outcome { get; init; }

    [StringLength(2000)]
    public string? Notes { get; init; }
}
