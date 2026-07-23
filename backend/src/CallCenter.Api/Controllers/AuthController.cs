using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CallCenter.Api.Controllers;

[ApiController]
[Produces("application/json")]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("signup")]
    [ProducesResponseType<LoginResponseDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoginResponseDto>> Signup(
        [FromBody] SignupRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await authService.SignupAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<LoginResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponseDto>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }
}
