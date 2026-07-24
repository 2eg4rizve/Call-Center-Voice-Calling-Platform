using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Services;

internal sealed class AuthService(
    IIdentityRepository identityRepository,
    IAgentRepository agentRepository,
    IUnitOfWork unitOfWork,
    IAccessTokenProvider accessTokenProvider) : IAuthService
{
    private const string AgentRole = "Agent";

    public async Task<LoginResponseDto> SignupAsync(
        SignupRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim();
        if (await identityRepository.EmailExistsAsync(email, cancellationToken))
            throw new ArgumentException("An account with this email already exists.");

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var identityResult = await identityRepository.CreateAgentAsync(
                request.FullName.Trim(),
                email,
                request.Password,
                token);
            if (!identityResult.Succeeded ||
                string.IsNullOrWhiteSpace(identityResult.IdentityUserId))
            {
                throw new ArgumentException(string.Join("; ", identityResult.Errors));
            }

            var agent = new Agent
            {
                IdentityUserId = identityResult.IdentityUserId,
                DisplayName = request.DisplayName.Trim(),
                Status = AgentStatus.Offline
            };
            await agentRepository.AddAsync(agent, token);
            await unitOfWork.SaveChangesAsync(token);

            return CreateLoginResponse(
                identityResult.IdentityUserId,
                request.FullName.Trim(),
                email,
                AgentRole,
                agent.Id);
        }, cancellationToken: cancellationToken);
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var identity = await identityRepository.AuthenticateAsync(
                request.Email.Trim(),
                request.Password,
                cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");
        var agent = await agentRepository.GetByIdentityUserIdAsync(
            identity.IdentityUserId,
            cancellationToken);

        return CreateLoginResponse(
            identity.IdentityUserId,
            identity.FullName,
            identity.Email,
            identity.Role,
            agent?.Id);
    }

    private LoginResponseDto CreateLoginResponse(
        string identityUserId,
        string fullName,
        string email,
        string role,
        Guid? agentId)
    {
        var token = accessTokenProvider.Create(
            identityUserId,
            email,
            fullName,
            role,
            agentId);

        return new LoginResponseDto
        {
            AccessToken = token.AccessToken,
            ExpiresAt = token.ExpiresAt,
            UserId = identityUserId,
            DisplayName = fullName,
            Email = email,
            Role = role,
            AgentId = agentId
        };
    }
}
