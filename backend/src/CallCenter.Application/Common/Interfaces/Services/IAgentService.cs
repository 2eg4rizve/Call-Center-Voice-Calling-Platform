using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;

namespace CallCenter.Application.Common.Interfaces.Services;

public interface IAgentService
{
    Task<AgentResponseDto> CreateAsync(
        CreateAgentRequestDto request,
        CancellationToken cancellationToken = default);

    Task<AgentResponseDto> UpdateAsync(
        Guid agentId,
        UpdateAgentRequestDto request,
        CancellationToken cancellationToken = default);

    Task<AgentResponseDto> GetCurrentAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<AgentSummaryResponseDto>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<AgentResponseDto> UpdateStatusAsync(
        string identityUserId,
        UpdateAgentStatusRequestDto request,
        CancellationToken cancellationToken = default);

    Task AssignToCallQueueAsync(
        AssignAgentToCallQueueRequestDto request,
        CancellationToken cancellationToken = default);
}
