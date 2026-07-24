using AutoMapper;
using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Services;

internal sealed class AgentService(
    IAgentRepository agentRepository,
    IAgentQueueRepository agentQueueRepository,
    ICallQueueRepository callQueueRepository,
    IIdentityRepository identityRepository,
    IUnitOfWork unitOfWork,
    ICallAssignmentService callAssignmentService,
    IMapper mapper) : IAgentService
{
    public async Task<AgentResponseDto> CreateAsync(
        CreateAgentRequestDto request,
        CancellationToken cancellationToken = default) =>
        await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var identityResult = await identityRepository.CreateAgentAsync(
                request.FullName.Trim(),
                request.Email.Trim(),
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
            return mapper.Map<AgentResponseDto>(agent);
        }, cancellationToken: cancellationToken);

    public async Task<AgentResponseDto> UpdateAsync(
        Guid agentId,
        UpdateAgentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var agent = await agentRepository.GetByIdWithCallQueuesAsync(agentId, cancellationToken)
            ?? throw new KeyNotFoundException("Agent was not found.");

        agent.DisplayName = request.DisplayName.Trim();
        agent.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return mapper.Map<AgentResponseDto>(agent);
    }

    public async Task<AgentResponseDto> GetCurrentAsync(
        string identityUserId,
        CancellationToken cancellationToken = default)
    {
        var agent = await agentRepository.GetByIdentityUserIdAsync(
                identityUserId,
                cancellationToken)
            ?? throw new KeyNotFoundException("Agent profile was not found.");

        return mapper.Map<AgentResponseDto>(agent);
    }

    public async Task<IReadOnlyCollection<AgentSummaryResponseDto>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var agents = await agentRepository.GetAllWithAssignedCallsAsync(cancellationToken);
        return mapper.Map<IReadOnlyCollection<AgentSummaryResponseDto>>(agents);
    }

    public async Task<AgentResponseDto> UpdateStatusAsync(
        string identityUserId,
        UpdateAgentStatusRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var agent = await agentRepository.GetByIdentityUserIdAsync(
                identityUserId,
                cancellationToken)
            ?? throw new KeyNotFoundException("Agent profile was not found.");

        agent.Status = request.Status!.Value;
        if (agent.Status == AgentStatus.Available)
            agent.LastAvailableAtUtc = DateTimeOffset.UtcNow;

        agent.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (agent.Status == AgentStatus.Available)
            await callAssignmentService.TryAssignNextWaitingCallToAgentAsync(
                agent.Id,
                cancellationToken);

        return mapper.Map<AgentResponseDto>(agent);
    }

    public async Task AssignToCallQueueAsync(
        AssignAgentToCallQueueRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var agent = await agentRepository.GetByIdAsync(request.AgentId, cancellationToken);
        var callQueue = await callQueueRepository.GetByIdAsync(
            request.CallQueueId,
            cancellationToken);

        if (agent is null || callQueue is null)
            throw new KeyNotFoundException("Agent or call queue was not found.");

        var membershipExists = await agentQueueRepository.MembershipExistsAsync(
            request.AgentId,
            request.CallQueueId,
            cancellationToken);
        if (membershipExists)
            return;

        await agentQueueRepository.AddAsync(new AgentQueue
        {
            AgentId = request.AgentId,
            CallQueueId = request.CallQueueId
        }, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
