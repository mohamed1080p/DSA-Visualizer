using Domain.Contracts;
using Domain.Exceptions;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using ServicesAbstraction;
using Shared.DTOs.IdentityDTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;


namespace Services.Auth
{
    public class AuthService(UserManager<ApplicationUser> _userManager, SignInManager<ApplicationUser> _signInManager, IUnitOfWork _unitOfWork,
         IConfiguration _configuration, ITokenGenerator _tokenGenerator, ITelemetryService _telemetry, ILogger<AuthService> _logger) : IAuthService
    {
        public async Task<UserDTO> LoginAsync(LoginDTO loginDTO)
        {
            // check on email
            var user = await _userManager.FindByEmailAsync(loginDTO.Email);
            if (user is null)
            {
                throw new InvalidCredentialsException("Invalid email or password.");
            }
            // check on password
            bool IsPasswordValid = await _userManager.CheckPasswordAsync(user, loginDTO.Password);
            if (!IsPasswordValid)
            {
                throw new InvalidCredentialsException("Invalid email or password.");
            }
            // check if account is active
            if (!user.IsActive)
            {
                throw new InvalidCredentialsException("Account is disabled.");
            }
            // update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            // generating tokens
            var accessToken = _tokenGenerator.GenerateAccessToken(user);
            var refreshToken = _tokenGenerator.GenerateRefreshToken();
            // revoke the old tokens and setting a new one
            await _unitOfWork.RefreshTokenRepository.RevokeRefreshTokenForUser(user.Id);
            await _unitOfWork.RefreshTokenRepository.AddRefreshTokenAsync(new RefreshToken()
            {
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JwtSettings:RefreshTokenExpiryInDays"])),
                IsRevoked = false,
                UserId = user.Id
            });

            await _unitOfWork.SaveChangesAsync();
            _telemetry.TrackAuditEvent("auth.login", user.Id);
            _logger.LogInformation("User login succeeded. UserId={UserId}", user.Id);
            // return the userDTO(mapping)
            return new UserDTO()
            {
                UserId = user.Id,
                Email = user.Email!,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                DisplayName = user.DisplayName,
                UserName = user.UserName!
            };

        }
        public async Task<UserDTO> RegisterAsync(RegisterDTO registerDTO)
        {
            // check if email exists
            var existingUser = await _userManager.FindByEmailAsync(registerDTO.Email);
            if (existingUser is not null)
            {
                throw new ArgumentException("Email is already in use");
            }
            // check if username exists
            var existingUserName = await _userManager.FindByNameAsync(registerDTO.UserName);
            if (existingUserName is not null)
            {
                throw new ArgumentException("Username is already in use.");
            }
            //create a new user
            var user = new ApplicationUser()
            {
                Email = registerDTO.Email,
                UserName = registerDTO.UserName,
                DisplayName = registerDTO.DisplayName,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                LastLoginAt = DateTime.UtcNow,
            };
            var result = await _userManager.CreateAsync(user, registerDTO.Password);
            if (!result.Succeeded)
            {
                throw new ArgumentException(string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            // generating tokens
            var accessToken = _tokenGenerator.GenerateAccessToken(user);
            var refreshToken = _tokenGenerator.GenerateRefreshToken();
            // saving tokens in Identity database
            await _unitOfWork.RefreshTokenRepository.AddRefreshTokenAsync(new RefreshToken()
            {
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JwtSettings:RefreshTokenExpiryInDays"])),
                IsRevoked = false,
                UserId = user.Id
            });

            await _unitOfWork.SaveChangesAsync();
            _telemetry.TrackAuditEvent("auth.register", user.Id);
            _logger.LogInformation("User registration succeeded. UserId={UserId}", user.Id);
            // return a new userDTO
            return new UserDTO()
            {
                UserId = user.Id,
                AccessToken = accessToken,
                DisplayName = user.DisplayName,
                Email = user.Email,
                RefreshToken = refreshToken,
                UserName = user.UserName
            };


        }
        public async Task LogoutAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }
            await _unitOfWork.RefreshTokenRepository.RevokeRefreshTokenForUser(id);
            _telemetry.TrackAuditEvent("auth.logout", id);
            _logger.LogInformation("User logout completed. UserId={UserId}", id);
        }
        public async Task<UserDTO> RefreshTokenAsync(TokenRequestDTO tokenRequestDTO)
        {
            var principal = GetPrincipalFromExpiredToken(tokenRequestDTO.AccessToken);
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                throw new InvalidCredentialsException("Invalid access token.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User not found.");
            }

            var storedRefreshToken = await _unitOfWork.RefreshTokenRepository.GetRefreshTokenAsync(tokenRequestDTO.RefreshToken);

            if (storedRefreshToken == null || storedRefreshToken.UserId != userId || !storedRefreshToken.IsActive)
            {
                throw new InvalidCredentialsException("Invalid or expired refresh token.");
            }
            // Generate new tokens
            var newAccessToken = _tokenGenerator.GenerateAccessToken(user);
            var newRefreshToken = _tokenGenerator.GenerateRefreshToken();
            // Revoke old refresh token and add a new one
            await _unitOfWork.RefreshTokenRepository.RevokeRefreshTokenForUser(userId);
            await _unitOfWork.RefreshTokenRepository.AddRefreshTokenAsync(new RefreshToken()
            {
                Token = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JwtSettings:RefreshTokenExpiryInDays"])),
                IsRevoked = false,
                UserId = user.Id
            });

            await _unitOfWork.SaveChangesAsync();
            _telemetry.TrackAuditEvent("auth.refresh_token", user.Id);
            _logger.LogInformation("User token refresh succeeded. UserId={UserId}", user.Id);

            return new UserDTO()
            {
                UserId = user.Id,
                Email = user.Email!,
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                DisplayName = user.DisplayName,
                UserName = user.UserName!
            };
        }
        public async Task<UserDTO> ExternalLoginAsync(ExternalLoginDTO externalLoginDTO)
        {
            var loginInfo = new UserLoginInfo(externalLoginDTO.Provider, externalLoginDTO.ProviderKey, externalLoginDTO.Provider);
            var user = await _userManager.FindByLoginAsync(loginInfo.LoginProvider, loginInfo.ProviderKey);

            if (user == null)
            {
                user = await _userManager.FindByEmailAsync(externalLoginDTO.Email);

                if (user == null)
                {
                    user = new ApplicationUser
                    {
                        Email = externalLoginDTO.Email,
                        UserName = externalLoginDTO.Email,
                        DisplayName = externalLoginDTO.Name,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true,
                        LastLoginAt = DateTime.UtcNow
                    };

                    var createResult = await _userManager.CreateAsync(user);
                    if (!createResult.Succeeded)
                    {
                        throw new InvalidOperationException(string.Join(", ", createResult.Errors.Select(e => e.Description)));
                    }
                }

                var addLoginResult = await _userManager.AddLoginAsync(user, loginInfo);
                if (!addLoginResult.Succeeded)
                {
                    throw new InvalidOperationException("Failed to link external login.");
                }
            }
            // update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            // Generate tokens
            var accessToken = _tokenGenerator.GenerateAccessToken(user);
            var refreshToken = _tokenGenerator.GenerateRefreshToken();
            // Revoke old refresh token and add new one
            await _unitOfWork.RefreshTokenRepository.RevokeRefreshTokenForUser(user.Id);
            await _unitOfWork.RefreshTokenRepository.AddRefreshTokenAsync(new RefreshToken()
            {
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JwtSettings:RefreshTokenExpiryInDays"])),
                IsRevoked = false,
                UserId = user.Id
            });

            await _unitOfWork.SaveChangesAsync();
            _telemetry.TrackAuditEvent("auth.external_login", user.Id);
            _logger.LogInformation(
                "External user login succeeded. UserId={UserId} Provider={ExternalProvider}",
                user.Id,
                externalLoginDTO.Provider);

            return new UserDTO
            {
                UserId = user.Id,
                Email = user.Email!,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                DisplayName = user.DisplayName,
                UserName = user.UserName!
            };
        }
        public AuthenticationProperties GetExternalAuthenticationProperties(string provider, string redirectUrl)
        {
            return _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
                ValidateLifetime = false
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            return principal;
        }
    }
}




