using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class CallRepository : Repository<Call>, ICallRepository
{
    private readonly CallCenterDbContext _dbContext;

    public CallRepository(CallCenterDbContext dbContext)
        : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Call?> GetByIdWithDetailsAsync(
        Guid callId,
        CancellationToken cancellationToken = default) =>
        BaseCallQuery()
            .Include(call => call.CallEvents.OrderBy(callEvent => callEvent.EventAtUtc))
            .SingleOrDefaultAsync(call => call.Id == callId, cancellationToken);

    public Task<Call?> GetCurrentCallForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default) =>
        BaseCallQuery()
            .AsNoTracking()
            .Where(call =>
                call.AssignedAgentId == agentId &&
                (call.Status == CallStatus.Assigned || call.Status == CallStatus.Active))
            .OrderByDescending(call => call.AssignedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Call>> GetWaitingCallsAsync(
        CancellationToken cancellationToken = default) =>
        await BaseCallQuery()
            .AsNoTracking()
            .Where(call => call.Status == CallStatus.Waiting)
            .OrderBy(call => call.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<Call?> GetOldestWaitingCallForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default) =>
        BaseCallQuery()
            .Where(call =>
                call.Status == CallStatus.Waiting &&
                call.CallQueue.AgentQueues.Any(membership => membership.AgentId == agentId))
            .OrderBy(call => call.CreatedAtUtc)
            .ThenBy(call => call.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<(IReadOnlyCollection<Call> Items, int TotalCount)> GetCallHistoryAsync(
        CallHistoryRequestDto request,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default)
    {
        var query = BaseCallQuery().AsNoTracking();
        if (restrictedAgentId.HasValue)
            query = query.Where(call => call.AssignedAgentId == restrictedAgentId.Value);
        else if (request.AgentId.HasValue)
            query = query.Where(call => call.AssignedAgentId == request.AgentId.Value);

        if (!string.IsNullOrWhiteSpace(request.CustomerSearch))
        {
            var search = request.CustomerSearch.Trim();
            query = query.Where(call =>
                call.Customer != null &&
                (call.Customer.Name.Contains(search) ||
                    call.Customer.CustomerReferenceNumber.Contains(search)));
        }

        if (request.Status.HasValue)
            query = query.Where(call => call.Status == request.Status.Value);
        if (request.Outcome.HasValue)
            query = query.Where(call => call.Outcome == request.Outcome.Value);
        if (request.FromDateUtc.HasValue)
            query = query.Where(call => call.CreatedAtUtc >= request.FromDateUtc.Value);
        if (request.ToDateUtc.HasValue)
            query = query.Where(call => call.CreatedAtUtc <= request.ToDateUtc.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var calls = await query
            .OrderByDescending(call => call.CreatedAtUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);
        return (calls, totalCount);
    }

    private IQueryable<Call> BaseCallQuery() =>
        _dbContext.Calls
            .Include(call => call.Customer)
            .Include(call => call.CallQueue)
            .Include(call => call.AssignedAgent);
}
