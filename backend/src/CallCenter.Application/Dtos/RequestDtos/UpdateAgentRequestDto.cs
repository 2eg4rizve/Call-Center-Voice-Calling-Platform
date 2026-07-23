using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class UpdateAgentRequestDto
{
    [Required, StringLength(150)]
    public string DisplayName { get; init; } = string.Empty;
}
