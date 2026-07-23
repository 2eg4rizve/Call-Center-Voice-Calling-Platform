using System.Security.Claims;

namespace CallCenter.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string GetRequiredIdentityUserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("The authenticated user identifier is missing.");

    public static Guid GetRequiredAgentId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(Authorization.CustomClaimTypes.AgentId);

        return Guid.TryParse(value, out var agentId)
            ? agentId
            : throw new UnauthorizedAccessException("The authenticated agent identifier is missing.");
    }
}
