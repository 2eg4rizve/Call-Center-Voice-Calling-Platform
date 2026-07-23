using CallCenter.Application.Dtos.ResponseDtos;

namespace CallCenter.Application.Common.Interfaces.Services;

public interface ICallAssignmentService
{
    Task<CallResponseDto?> TryAssignCallAsync(
        Guid callId,
        CancellationToken cancellationToken = default);

    Task<CallResponseDto?> TryAssignNextWaitingCallToAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default);
}
