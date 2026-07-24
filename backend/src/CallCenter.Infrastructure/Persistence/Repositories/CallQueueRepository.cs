using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class CallQueueRepository : Repository<CallQueue>, ICallQueueRepository
{
    private readonly CallCenterDbContext _dbContext;

    public CallQueueRepository(CallCenterDbContext dbContext)
        : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<CallQueue>> GetActiveAsync(
        CancellationToken cancellationToken = default) =>
        await _dbContext.CallQueues
            .AsNoTracking()
            .Where(queue => queue.IsActive)
            .OrderBy(queue => queue.Name)
            .ToListAsync(cancellationToken);

    public Task<CallQueue?> GetByNameAsync(
        string name,
        CancellationToken cancellationToken = default) =>
        _dbContext.CallQueues
            .AsNoTracking()
            .SingleOrDefaultAsync(queue => queue.Name == name, cancellationToken);
}
