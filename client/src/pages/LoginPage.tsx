import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { OAuthButtons } from '@/components/OAuthButtons';
import { useAuth } from '@/context/use-auth';
import { ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/progress';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="relative flex flex-1 items-center justify-center p-8">
        <Link
          to="/"
          className="absolute left-6 top-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <PageTransition>
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <span className="font-display text-xl font-bold">
                DSA <span className="text-primary">Visualizer</span>
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold">Welcome back!</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue your learning journey.</p>

            <form
              className="mt-8 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                try {
                  await login(email, password);
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Sign in failed.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="login-email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  id="login-email"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <span className="text-xs text-muted-foreground">Use the password you registered with</span>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="login-password"
                    required
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-md border border-border bg-surface px-3 pr-10 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary font-semibold text-primary-foreground transition-all hover:shadow-glow disabled:opacity-60"
              >
                <Mail className="h-4 w-4" /> {loading ? 'Signing in…' : 'Sign In'}
              </motion.button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 font-mono text-muted-foreground">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <OAuthButtons />
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>

            <div className="mt-12 space-x-4 text-center text-xs text-muted-foreground">
              <span>Runs against the DSA-Visualizer API (see README in repo).</span>
            </div>
          </div>
        </PageTransition>
      </div>

      <div className="relative hidden flex-1 overflow-hidden border-l border-border bg-gradient-surface lg:flex">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 bg-[var(--gradient-glow)]" />
        <div className="relative flex w-full flex-col justify-between p-12">
          <div className="font-mono text-xs text-primary">{'// JWT_TOKEN_GENERATOR.cs'}</div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-md rounded-xl border border-border bg-background/80 p-6 backdrop-blur"
          >
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground">
              {`namespace DSAVisualizer.Auth
{
  public class JwtTokenGenerator
  {
    private readonly string _secretKey;

    public string `}
              <span className="text-primary">GenerateToken</span>
              {`(User user)
    {
      var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_secretKey));
      var creds = new SigningCredentials(
        key, SecurityAlgorithms.HmacSha256);
      var claims = new[] {
        new Claim("sub", user.Id),
        new Claim("name", user.Name),
        new Claim("email", user.Email),
      };
      return new JwtSecurityTokenHandler()
        .WriteToken(token);
    }
  }
}`}
            </pre>
          </motion.div>
          <div className="grid max-w-md grid-cols-3 gap-3">
            {[
              { l: 'Algorithm', v: 'HS256' },
              { l: 'Expires', v: '30 min' },
              { l: 'Issuer', v: 'DSA-Visualizer' },
            ].map((j) => (
              <div key={j.l} className="rounded-md border border-border bg-background/60 p-3 backdrop-blur">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{j.l}</div>
                <div className="mt-1 font-mono text-sm text-primary">{j.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
