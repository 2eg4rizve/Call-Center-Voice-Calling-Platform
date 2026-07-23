using CallCenter.Domain.Common;
using System.Data;

namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface IUnitOfWork
{
    IRepository<TEntity> GetRepository<TEntity>()
        where TEntity : BaseEntity;

    Task<ITransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
