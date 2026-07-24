namespace CallCenter.Application.Common.Interfaces.Services;

public interface IAccessTokenProvider
{
    AccessTokenResult Create(
        string identityUserId,
        string email,
        string displayName,
        string role,
        Guid? agentId);
}

public sealed record AccessTokenResult(string AccessToken, DateTimeOffset ExpiresAt);
