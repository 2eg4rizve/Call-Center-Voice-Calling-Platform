using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;

namespace CallCenter.Application.Common.Interfaces.Services;

public interface ICallService
{
    Task<CallResponseDto> CreateInboundCallAsync(
        CreateCallRequestDto request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<CallResponseDto>> GetWaitingCallsAsync(
        CancellationToken cancellationToken = default);

    Task<CallResponseDto?> GetCurrentCallForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default);

    Task<CallResponseDto> AcceptAsync(
        Guid callId,
        Guid agentId,
        CancellationToken cancellationToken = default);

    Task<CallResponseDto> CompleteAsync(
        Guid callId,
        Guid agentId,
        CompleteCallRequestDto request,
        CancellationToken cancellationToken = default);

    Task<PagedResponseDto<CallHistoryResponseDto>> GetHistoryAsync(
        CallHistoryRequestDto request,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default);

    Task<CallDetailsResponseDto> GetDetailsAsync(
        Guid callId,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default);
}
