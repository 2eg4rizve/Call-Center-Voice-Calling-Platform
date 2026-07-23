using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Calls.Dtos;

public sealed class CreateCallRequestDto
{
    public Guid? CustomerId { get; init; }

    [Phone]
    public string? CallerPhoneNumber { get; init; }

    public Guid CallQueueId { get; init; }
}
