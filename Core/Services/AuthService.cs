
using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ServicesAbstraction;
using Shared.DTOs.IdentityDTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Services
{
    public class AuthService(UserManager<ApplicationUser> _userManager, IUnitOfWork _unitOfWork,
         IConfiguration _configuration) : IAuthService
    {
        public async Task<UserDTO> LoginAsync(LoginDTO loginDTO)
        {
            // check on email
            var user = await _userManager.FindByEmailAsync(loginDTO.Email);
            if(user is null)
            {
                throw new Exception("Invalid email or password.");
            }

            // check on password
            bool IsPasswordValid = await _userManager.CheckPasswordAsync(user, loginDTO.Password);
            if(!IsPasswordValid)
            {
                throw new Exception("Invalid email or password.");
            }

            // check if account is active
            if(!user.IsActive)
            {
                throw new Exception("Account is disabled.");
            }

            // update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // generating tokens
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();

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

            // return the userDTO(mapping)
            return new UserDTO()
            {
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
            if(existingUser is not null)
            {
                throw new Exception("Email is already in use");
            }

            // check if username exists
            var existingUserName = await _userManager.FindByNameAsync(registerDTO.UserName);
            if(existingUserName is not null)
            {
                throw new Exception("Username is already in use.");
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
                throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            // generating tokens
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();

            // saving tokens in Identity database
            await _unitOfWork.RefreshTokenRepository.AddRefreshTokenAsync(new RefreshToken()
            {
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JwtSettings:RefreshTokenExpiryInDays"])),
                IsRevoked = false,
                UserId = user.Id
            });

            await _unitOfWork.SaveChangesAsync();

            // return a new userDTO
            return new UserDTO()
            {
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
            if(user is null)
            {
                throw new Exception("User not found.");
            }
            await _unitOfWork.RefreshTokenRepository.RevokeRefreshTokenForUser(id);
        }

        public async Task<UserDTO> RefreshTokenAsync(TokenRequestDTO tokenRequestDTO)
        {
            var principal = GetPrincipalFromExpiredToken(tokenRequestDTO.AccessToken);
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                throw new Exception("Invalid access token.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found.");
            }

            var storedRefreshToken = await _unitOfWork.RefreshTokenRepository.GetRefreshTokenAsync(tokenRequestDTO.RefreshToken);

            if (storedRefreshToken == null || storedRefreshToken.UserId != userId || !storedRefreshToken.IsActive)
            {
                throw new Exception("Invalid or expired refresh token.");
            }

            // Generate new tokens
            var newAccessToken = GenerateAccessToken(user);
            var newRefreshToken = GenerateRefreshToken();

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

            return new UserDTO()
            {
                Email = user.Email!,
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                DisplayName = user.DisplayName,
                UserName = user.UserName!
            };
        }



        // ------------------- helper methods -------------------
        private string GenerateAccessToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim("DisplayName", user.DisplayName)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpiryInMinutes"])),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
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
