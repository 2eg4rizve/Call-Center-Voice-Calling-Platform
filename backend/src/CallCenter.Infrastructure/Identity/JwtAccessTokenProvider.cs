using CallCenter.Application.Common.Interfaces.Services;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CallCenter.Infrastructure.Identity;

internal sealed class JwtAccessTokenProvider(IOptions<JwtOptions> options) : IAccessTokenProvider
{
    public AccessTokenResult Create(
        string identityUserId,
        string email,
        string displayName,
        string role,
        Guid? agentId)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(options.Value.ExpiryMinutes);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, identityUserId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, displayName),
            new(ClaimTypes.Role, role)
        };
        if (agentId.HasValue)
            claims.Add(new Claim("agent_id", agentId.Value.ToString()));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Value.Key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            options.Value.Issuer,
            options.Value.Audience,
            claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new AccessTokenResult(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt);
    }
}
