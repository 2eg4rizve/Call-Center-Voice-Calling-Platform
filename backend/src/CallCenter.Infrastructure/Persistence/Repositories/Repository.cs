using System.Linq.Expressions;
using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class Repository<TEntity>(CallCenterDbContext dbContext) : IRepository<TEntity>
    where TEntity : BaseEntity
{
    private readonly DbSet<TEntity> _entities = dbContext.Set<TEntity>();

    public IQueryable<TEntity> Query() => _entities.AsNoTracking();

    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _entities.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

    public Task<TEntity?> FirstOrDefaultAsync(
        Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken = default) =>
        _entities.AsNoTracking().FirstOrDefaultAsync(predicate, cancellationToken);

    public Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
        _entities.AddAsync(entity, cancellationToken).AsTask();

    public void Update(TEntity entity) => _entities.Update(entity);

    public void Remove(TEntity entity) => _entities.Remove(entity);
}
