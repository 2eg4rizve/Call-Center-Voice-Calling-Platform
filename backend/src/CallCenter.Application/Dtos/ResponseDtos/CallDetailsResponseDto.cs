namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class CallDetailsResponseDto : CallResponseDto
{
    public IReadOnlyCollection<CallEventResponseDto> Events { get; init; } = [];
}
