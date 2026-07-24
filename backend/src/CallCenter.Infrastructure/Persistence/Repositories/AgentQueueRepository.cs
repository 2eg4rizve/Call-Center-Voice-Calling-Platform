using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class AgentQueueRepository : Repository<AgentQueue>, IAgentQueueRepository
{
    private readonly CallCenterDbContext _dbContext;

    public AgentQueueRepository(CallCenterDbContext dbContext)
        : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<bool> MembershipExistsAsync(
        Guid agentId,
        Guid callQueueId,
        CancellationToken cancellationToken = default) =>
        _dbContext.AgentQueues.AnyAsync(
            membership =>
                membership.AgentId == agentId && membership.CallQueueId == callQueueId,
            cancellationToken);

    public async Task<IReadOnlyCollection<Guid>> GetCallQueueIdsForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default) =>
        await _dbContext.AgentQueues
            .AsNoTracking()
            .Where(membership => membership.AgentId == agentId)
            .Select(membership => membership.CallQueueId)
            .ToListAsync(cancellationToken);
}
