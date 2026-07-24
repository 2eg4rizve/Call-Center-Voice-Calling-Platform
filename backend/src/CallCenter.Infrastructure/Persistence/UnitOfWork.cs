using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace CallCenter.Infrastructure.Persistence;

internal sealed class UnitOfWork(CallCenterDbContext dbContext) : IUnitOfWork
{
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException exception)
        {
            throw new DataConcurrencyException(
                "The database record changed while it was being updated.",
                exception);
        }
    }

    public async Task<ITransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default)
    {
        var transaction = await dbContext.Database.BeginTransactionAsync(
            isolationLevel,
            cancellationToken);

        return new EfTransaction(transaction);
    }

    public async Task<TResult> ExecuteInTransactionAsync<TResult>(
        Func<CancellationToken, Task<TResult>> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                isolationLevel,
                cancellationToken);
            var result = await operation(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        });
    }
}
