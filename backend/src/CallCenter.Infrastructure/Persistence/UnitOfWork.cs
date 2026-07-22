using CallCenter.Application.Common.Interfaces;
using CallCenter.Domain.Common;
using CallCenter.Infrastructure.Persistence.Repositories;

namespace CallCenter.Infrastructure.Persistence;

internal sealed class UnitOfWork(CallCenterDbContext dbContext) : IUnitOfWork
{
    private readonly Dictionary<Type, object> _repositories = [];

    public IRepository<TEntity> GetRepository<TEntity>() where TEntity : BaseEntity
    {
        var entityType = typeof(TEntity);

        if (_repositories.TryGetValue(entityType, out var repository))
        {
            return (IRepository<TEntity>)repository;
        }

        var newRepository = new Repository<TEntity>(dbContext);
        _repositories[entityType] = newRepository;

        return newRepository;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
