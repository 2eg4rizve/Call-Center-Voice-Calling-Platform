using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class AgentRepository : Repository<Agent>, IAgentRepository
{
    private readonly CallCenterDbContext _dbContext;

    public AgentRepository(CallCenterDbContext dbContext)
        : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Agent?> GetByIdWithCallQueuesAsync(
        Guid agentId,
        CancellationToken cancellationToken = default) =>
        _dbContext.Agents
            .Include(agent => agent.AgentQueues)
            .ThenInclude(agentQueue => agentQueue.CallQueue)
            .SingleOrDefaultAsync(agent => agent.Id == agentId, cancellationToken);

    public Task<Agent?> GetByIdentityUserIdAsync(
        string identityUserId,
        CancellationToken cancellationToken = default) =>
        _dbContext.Agents
            .Include(agent => agent.AgentQueues)
            .ThenInclude(agentQueue => agentQueue.CallQueue)
            .SingleOrDefaultAsync(
                agent => agent.IdentityUserId == identityUserId,
                cancellationToken);

    public async Task<IReadOnlyCollection<Agent>> GetAllWithAssignedCallsAsync(
        CancellationToken cancellationToken = default) =>
        await _dbContext.Agents
            .AsNoTracking()
            .Include(agent => agent.AgentQueues)
            .ThenInclude(agentQueue => agentQueue.CallQueue)
            .Include(agent => agent.AssignedCalls)
            .OrderBy(agent => agent.DisplayName)
            .ToListAsync(cancellationToken);

    public Task<Agent?> GetLongestIdleEligibleAgentAsync(
        Guid callQueueId,
        CancellationToken cancellationToken = default) =>
        _dbContext.Agents
            .Where(agent =>
                agent.Status == AgentStatus.Available &&
                agent.AgentQueues.Any(membership => membership.CallQueueId == callQueueId) &&
                !agent.AssignedCalls.Any(call =>
                    call.Status == CallStatus.Assigned || call.Status == CallStatus.Active))
            .OrderBy(agent => agent.LastAvailableAtUtc ?? DateTimeOffset.MinValue)
            .ThenBy(agent => agent.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> HasAssignedOrActiveCallAsync(
        Guid agentId,
        CancellationToken cancellationToken = default) =>
        _dbContext.Calls.AnyAsync(
            call => call.AssignedAgentId == agentId &&
                (call.Status == CallStatus.Assigned || call.Status == CallStatus.Active),
            cancellationToken);
}
