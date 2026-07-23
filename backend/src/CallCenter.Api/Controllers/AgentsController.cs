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
[Route("api/agents")]
public sealed class AgentsController(IAgentService agentService) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<IReadOnlyCollection<AgentSummaryResponseDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<AgentSummaryResponseDto>>> GetAll(
        CancellationToken cancellationToken) =>
        Ok(await agentService.GetAllAsync(cancellationToken));

    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.AgentOnly)]
    [ProducesResponseType<AgentResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AgentResponseDto>> GetCurrent(CancellationToken cancellationToken)
    {
        var identityUserId = User.GetRequiredIdentityUserId();
        return Ok(await agentService.GetCurrentAsync(identityUserId, cancellationToken));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<AgentResponseDto>(StatusCodes.Status201Created)]
    public async Task<ActionResult<AgentResponseDto>> Create(
        [FromBody] CreateAgentRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await agentService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPut("{agentId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<AgentResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AgentResponseDto>> Update(
        Guid agentId,
        [FromBody] UpdateAgentRequestDto request,
        CancellationToken cancellationToken) =>
        Ok(await agentService.UpdateAsync(agentId, request, cancellationToken));

    [HttpPatch("me/status")]
    [Authorize(Policy = AuthorizationPolicies.AgentOnly)]
    [ProducesResponseType<AgentResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AgentResponseDto>> UpdateStatus(
        [FromBody] UpdateAgentStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        var identityUserId = User.GetRequiredIdentityUserId();
        return Ok(await agentService.UpdateStatusAsync(identityUserId, request, cancellationToken));
    }

    [HttpPost("call-queues")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AssignToCallQueue(
        [FromBody] AssignAgentToCallQueueRequestDto request,
        CancellationToken cancellationToken)
    {
        await agentService.AssignToCallQueueAsync(request, cancellationToken);
        return NoContent();
    }
}
