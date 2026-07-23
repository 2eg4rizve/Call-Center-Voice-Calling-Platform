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
[Route("api/customers")]
public sealed class CustomersController(ICustomerService customerService) : ControllerBase
{
    [HttpGet("{customerId:guid}")]
    [ProducesResponseType<CustomerResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponseDto>> GetById(
        Guid customerId,
        CancellationToken cancellationToken) =>
        Ok(await customerService.GetByIdAsync(customerId, cancellationToken));

    [HttpGet("lookup")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CustomerResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerResponseDto>> Lookup(
        [FromQuery] CustomerLookupRequestDto request,
        CancellationToken cancellationToken) =>
        Ok(await customerService.LookupAsync(request, cancellationToken));

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CustomerResponseDto>(StatusCodes.Status201Created)]
    public async Task<ActionResult<CustomerResponseDto>> Create(
        [FromBody] CreateCustomerRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await customerService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPut("{customerId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.SupervisorOnly)]
    [ProducesResponseType<CustomerResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CustomerResponseDto>> Update(
        Guid customerId,
        [FromBody] UpdateCustomerRequestDto request,
        CancellationToken cancellationToken) =>
        Ok(await customerService.UpdateAsync(customerId, request, cancellationToken));
}
