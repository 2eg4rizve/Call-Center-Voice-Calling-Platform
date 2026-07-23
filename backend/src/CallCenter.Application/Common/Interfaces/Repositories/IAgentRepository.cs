using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface IAgentRepository : IRepository<Agent>
{
    Task<Agent?> GetByIdentityUserIdAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<Agent>> GetAllWithCallQueuesAsync(
        CancellationToken cancellationToken = default);

    Task<Agent?> GetLongestIdleEligibleAgentAsync(
        Guid callQueueId,
        CancellationToken cancellationToken = default);

    Task<bool> HasAssignedOrActiveCallAsync(
        Guid agentId,
        CancellationToken cancellationToken = default);
}
