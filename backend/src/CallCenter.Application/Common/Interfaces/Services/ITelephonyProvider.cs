namespace CallCenter.Application.Common.Interfaces.Services;

public interface ITelephonyProvider
{
    Task<string> GenerateCallReferenceAsync(
        CancellationToken cancellationToken = default);
}
