using CallCenter.Domain.Common;

namespace CallCenter.Application.Common.Interfaces;

public interface IUnitOfWork
{
    IRepository<TEntity> GetRepository<TEntity>()
        where TEntity : BaseEntity;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
