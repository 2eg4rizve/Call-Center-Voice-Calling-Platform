using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface ICallRepository : IRepository<Call>
{
    Task<Call?> GetByIdWithDetailsAsync(
        Guid callId,
        CancellationToken cancellationToken = default);

    Task<Call?> GetCurrentCallForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveCallForAgentAsync(
        Guid agentId,
        Guid excludedCallId,
        CancellationToken cancellationToken = default);

    Task<bool> HasOtherAssignedCallsAsync(
        Guid agentId,
        Guid excludedCallId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<Call>> GetWaitingCallsAsync(
        CancellationToken cancellationToken = default);

    Task<Call?> GetOldestWaitingCallForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyCollection<Call> Items, int TotalCount)> GetCallHistoryAsync(
        CallHistoryRequestDto request,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default);
}
