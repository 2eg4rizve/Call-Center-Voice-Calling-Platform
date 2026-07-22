using CallCenter.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Agents.Dtos;

public sealed class UpdateAgentStatusRequestDto
{
    [Required]
    public AgentStatus? Status { get; init; }
}
