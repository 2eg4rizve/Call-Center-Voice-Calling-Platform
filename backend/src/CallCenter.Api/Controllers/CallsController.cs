using CallCenter.Api.Authorization;
using CallCenter.Api.Extensions;
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
[Route("api/calls")]
public sealed class CallsController(
    ICallService callService,
    ICallAssignmentService callAssignmentService) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CallResponseDto>(StatusCodes.Status201Created)]
    public async Task<ActionResult<CallResponseDto>> CreateInboundCall(
        [FromBody] CreateCallRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await callService.CreateInboundCallAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpGet("waiting")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<IReadOnlyCollection<CallResponseDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<CallResponseDto>>> GetWaiting(
        CancellationToken cancellationToken) =>
        Ok(await callService.GetWaitingCallsAsync(cancellationToken));

    [HttpGet("current")]
    [Authorize(Policy = AuthorizationPolicies.AgentOnly)]
    [ProducesResponseType<CallResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<CallResponseDto>> GetCurrent(CancellationToken cancellationToken)
    {
        var response = await callService.GetCurrentCallForAgentAsync(
            User.GetRequiredAgentId(),
            cancellationToken);

        return response is null ? NoContent() : Ok(response);
    }

    [HttpPost("{callId:guid}/assign")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CallResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<CallResponseDto>> Assign(
        Guid callId,
        CancellationToken cancellationToken)
    {
        var response = await callAssignmentService.TryAssignCallAsync(callId, cancellationToken);
        return response is null ? NoContent() : Ok(response);
    }

    [HttpPost("{callId:guid}/assign/{agentId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CallResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CallResponseDto>> AssignToAgent(
        Guid callId,
        Guid agentId,
        CancellationToken cancellationToken) =>
        Ok(await callAssignmentService.AssignCallToAgentAsync(
            callId,
            agentId,
            cancellationToken));

    [HttpPost("{callId:guid}/accept")]
    [Authorize(Policy = AuthorizationPolicies.AgentOnly)]
    [ProducesResponseType<CallResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CallResponseDto>> Accept(
        Guid callId,
        CancellationToken cancellationToken) =>
        Ok(await callService.AcceptAsync(callId, User.GetRequiredAgentId(), cancellationToken));

    [HttpPost("{callId:guid}/complete")]
    [Authorize(Policy = AuthorizationPolicies.AgentOnly)]
    [ProducesResponseType<CallResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CallResponseDto>> Complete(
        Guid callId,
        [FromBody] CompleteCallRequestDto request,
        CancellationToken cancellationToken) =>
        Ok(await callService.CompleteAsync(
            callId,
            User.GetRequiredAgentId(),
            request,
            cancellationToken));

    [HttpGet("history")]
    [ProducesResponseType<PagedResponseDto<CallHistoryResponseDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponseDto<CallHistoryResponseDto>>> GetHistory(
        [FromQuery] CallHistoryRequestDto request,
        CancellationToken cancellationToken)
    {
        Guid? restrictedAgentId = User.IsInRole(ApplicationRoles.Supervisor)
            ? null
            : User.GetRequiredAgentId();

        return Ok(await callService.GetHistoryAsync(
            request,
            restrictedAgentId,
            cancellationToken));
    }

    [HttpGet("{callId:guid}")]
    [ProducesResponseType<CallDetailsResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CallDetailsResponseDto>> GetDetails(
        Guid callId,
        CancellationToken cancellationToken)
    {
        Guid? restrictedAgentId = User.IsInRole(ApplicationRoles.Supervisor)
            ? null
            : User.GetRequiredAgentId();

        return Ok(await callService.GetDetailsAsync(
            callId,
            restrictedAgentId,
            cancellationToken));
    }
}
