using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Common;
using CallCenter.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Data;

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

    public async Task<ITransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default)
    {
        var transaction = await dbContext.Database.BeginTransactionAsync(
            isolationLevel,
            cancellationToken);

        return new EfTransaction(transaction);
    }
}
