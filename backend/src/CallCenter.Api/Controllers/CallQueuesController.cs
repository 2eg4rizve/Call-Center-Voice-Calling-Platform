using CallCenter.Api.Authorization;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CallCenter.Api.Controllers;

[ApiController]
[Authorize]
[Produces("application/json")]
[ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status403Forbidden)]
[Route("api/call-queues")]
public sealed class CallQueuesController(ICallQueueService callQueueService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyCollection<CallQueueResponseDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<CallQueueResponseDto>>> GetActive(
        CancellationToken cancellationToken) =>
        Ok(await callQueueService.GetActiveAsync(cancellationToken));

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CallQueueResponseDto>(StatusCodes.Status201Created)]
    public async Task<ActionResult<CallQueueResponseDto>> Create(
        [FromBody] CreateCallQueueRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await callQueueService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetActive), response);
    }

    [HttpPut("{callQueueId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CallQueueResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CallQueueResponseDto>> Update(
        Guid callQueueId,
        [FromBody] UpdateCallQueueRequestDto request,
        CancellationToken cancellationToken) =>
        Ok(await callQueueService.UpdateAsync(callQueueId, request, cancellationToken));
}
