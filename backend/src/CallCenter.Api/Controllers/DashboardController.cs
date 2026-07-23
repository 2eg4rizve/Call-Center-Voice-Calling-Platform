using CallCenter.Api.Authorization;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.ResponseDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CallCenter.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
[Produces("application/json")]
[ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status403Forbidden)]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("metrics")]
    [ProducesResponseType<DashboardMetricsResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardMetricsResponseDto>> GetMetrics(
        CancellationToken cancellationToken) =>
        Ok(await dashboardService.GetMetricsAsync(cancellationToken));

    [HttpGet("agents")]
    [ProducesResponseType<AgentStatusSummaryResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AgentStatusSummaryResponseDto>> GetAgentStatuses(
        CancellationToken cancellationToken) =>
        Ok(await dashboardService.GetAgentStatusSummaryAsync(cancellationToken));

    [HttpGet("calls")]
    [ProducesResponseType<OperationalCallsResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<OperationalCallsResponseDto>> GetOperationalCalls(
        CancellationToken cancellationToken) =>
        Ok(await dashboardService.GetOperationalCallsAsync(cancellationToken));
}
