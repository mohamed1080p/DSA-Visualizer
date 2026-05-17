import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { OAuthButtons } from '@/components/OAuthButtons';
import { useAuth } from '@/context/use-auth';
import { ApiError } from '@/lib/api-client';

export default function RegisterPage() {
  const { register } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [displayName, setDisplayName] = useState('');
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
            <h1 className="font-display text-3xl font-bold">Create account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Start learning with a free account.</p>

            <form
              className="mt-8 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                try {
                  await register({ email, password, userName, displayName });
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Registration failed.');
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
                <label htmlFor="register-display-name" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Display name
                </label>
                <input
                  id="register-display-name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="register-user-name" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Username
                </label>
                <input
                  id="register-user-name"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="register-email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  id="register-email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="register-password" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="register-password"
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <Mail className="h-4 w-4" /> {loading ? 'Creating…' : 'Sign up'}
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
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </PageTransition>
      </div>
      <div className="relative hidden flex-1 overflow-hidden border-l border-border bg-gradient-surface lg:flex">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 bg-[var(--gradient-glow)]" />
      </div>
    </div>
  );
}
