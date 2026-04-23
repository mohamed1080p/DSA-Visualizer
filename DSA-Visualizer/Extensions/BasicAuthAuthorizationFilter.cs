using Hangfire.Dashboard;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;
using System.Text;

namespace DSA_Visualizer.Extensions
{
    public class BasicAuthAuthorizationFilter : IDashboardAuthorizationFilter
    {
        private readonly string _login;
        private readonly string _password;

        public BasicAuthAuthorizationFilter(string login, string password)
        {
            _login = login;
            _password = password;
        }

        public bool Authorize(DashboardContext context)
        {
            var httpContext = context.GetHttpContext();

            var header = httpContext.Request.Headers["Authorization"];

            if (!string.IsNullOrWhiteSpace(header) && AuthenticationHeaderValue.TryParse(header, out var authHeader))
            {
                if ("Basic".Equals(authHeader.Scheme, StringComparison.OrdinalIgnoreCase) && authHeader.Parameter != null)
                {
                    try
                    {
                        var credentialBytes = Convert.FromBase64String(authHeader.Parameter);
                        var credentials = Encoding.UTF8.GetString(credentialBytes).Split(':', 2);

                        if (credentials.Length == 2 && credentials[0] == _login && credentials[1] == _password)
                        {
                            return true;
                        }
                    }
                    catch
                    {
                        
                    }
                }
            }

            httpContext.Response.StatusCode = 401;
            httpContext.Response.Headers.Append("WWW-Authenticate", "Basic realm=\"Hangfire Dashboard\"");
            return false;
        }
    }
}
