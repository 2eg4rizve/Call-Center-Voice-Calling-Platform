using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class CustomerRepository : Repository<Customer>, ICustomerRepository
{
    private readonly CallCenterDbContext _dbContext;

    public CustomerRepository(CallCenterDbContext dbContext)
        : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Customer?> GetByPhoneNumberAsync(
        string phoneNumber,
        CancellationToken cancellationToken = default) =>
        _dbContext.Customers
            .AsNoTracking()
            .SingleOrDefaultAsync(
                customer => customer.PhoneNumber == phoneNumber,
                cancellationToken);

    public Task<Customer?> GetByReferenceNumberAsync(
        string referenceNumber,
        CancellationToken cancellationToken = default) =>
        _dbContext.Customers
            .AsNoTracking()
            .SingleOrDefaultAsync(
                customer => customer.CustomerReferenceNumber == referenceNumber,
                cancellationToken);
}
