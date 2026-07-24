using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class CallEventRepository : Repository<CallEvent>, ICallEventRepository
{
    private readonly CallCenterDbContext _dbContext;

    public CallEventRepository(CallCenterDbContext dbContext)
        : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<CallEvent>> GetByCallIdAsync(
        Guid callId,
        CancellationToken cancellationToken = default) =>
        await _dbContext.CallEvents
            .AsNoTracking()
            .Where(callEvent => callEvent.CallId == callId)
            .OrderBy(callEvent => callEvent.EventAtUtc)
            .ToListAsync(cancellationToken);
}
