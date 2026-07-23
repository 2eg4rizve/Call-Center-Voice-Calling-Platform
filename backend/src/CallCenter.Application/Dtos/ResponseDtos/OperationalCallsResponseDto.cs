namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class OperationalCallsResponseDto
{
    public IReadOnlyCollection<CallResponseDto> WaitingCalls { get; init; } = [];

    public IReadOnlyCollection<CallResponseDto> ActiveCalls { get; init; } = [];
}
