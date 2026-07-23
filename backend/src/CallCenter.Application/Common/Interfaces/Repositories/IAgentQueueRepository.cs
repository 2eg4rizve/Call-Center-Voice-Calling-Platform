using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface IAgentQueueRepository : IRepository<AgentQueue>
{
    Task<bool> MembershipExistsAsync(
        Guid agentId,
        Guid callQueueId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<Guid>> GetCallQueueIdsForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default);
}
