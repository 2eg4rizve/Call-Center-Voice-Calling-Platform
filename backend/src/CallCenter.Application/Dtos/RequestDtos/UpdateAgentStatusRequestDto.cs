using CallCenter.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class UpdateAgentStatusRequestDto
{
    [Required]
    public AgentStatus? Status { get; init; }
}
