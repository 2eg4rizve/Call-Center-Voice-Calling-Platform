namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class PagedResponseDto<T>
{
    public IReadOnlyCollection<T> Items { get; init; } = [];

    public int TotalCount { get; init; }

    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalPages => PageSize <= 0
        ? 0
        : (int)Math.Ceiling(TotalCount / (double)PageSize);
}
