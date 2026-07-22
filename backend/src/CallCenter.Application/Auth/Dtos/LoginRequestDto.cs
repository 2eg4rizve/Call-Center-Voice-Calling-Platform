using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Auth.Dtos;

public sealed class LoginRequestDto
{
    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;
}
