namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class LoginResponseDto
{
    public string AccessToken { get; init; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; init; }

    public string UserId { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public Guid? AgentId { get; init; }
}
