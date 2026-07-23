using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class CreateCallRequestDto : IValidatableObject
{
    public Guid? CustomerId { get; init; }

    [Phone]
    public string? CallerPhoneNumber { get; init; }

    public Guid CallQueueId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var hasCustomer = CustomerId.HasValue && CustomerId.Value != Guid.Empty;
        var hasPhoneNumber = !string.IsNullOrWhiteSpace(CallerPhoneNumber);

        if (hasCustomer == hasPhoneNumber)
        {
            yield return new ValidationResult(
                "Provide either CustomerId or CallerPhoneNumber, but not both.",
                [nameof(CustomerId), nameof(CallerPhoneNumber)]);
        }

        if (CallQueueId == Guid.Empty)
        {
            yield return new ValidationResult(
                "CallQueueId is required.",
                [nameof(CallQueueId)]);
        }
    }
}
