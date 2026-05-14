import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Command, Bell, ChevronRight, LogOut, User, Swords, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/use-auth';
import { useSignalR } from '@/context/SignalRContext';
import { AnimatePresence } from 'framer-motion';

const NAV = [
  { to: '/topics', label: 'Topics' },
  { to: '/problems', label: 'Problems' },
  { to: '/visualizer', label: 'Visualizer' },
  { to: '/path', label: 'Path' },
  { to: '/playground', label: 'Playground' },
  { to: '/community', label: 'Community' },
  { to: '/progress', label: 'Progress' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentBattle } = useSignalR();

  useEffect(() => {
    if (currentBattle && location.pathname !== '/battle') {
      navigate('/battle');
    }
  }, [currentBattle, location.pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header pathname={location.pathname} />
      <main className="flex-1">{children}</main>
      <ChatNotification />
      <ChallengeNotification />
      <Footer />
    </div>
  );
}

function ChallengeNotification() {
  const { challenges, acceptChallenge, dismissChallenge } = useSignalR();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {challenges.map((c) => (
          <motion.div
            key={c.challengeId}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="flex w-80 flex-col gap-3 rounded-xl border border-warning/30 bg-surface p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-warning/10 text-warning">
                <Swords className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold">Battle Challenge!</div>
                <div className="truncate text-xs text-muted-foreground">User {c.fromUserId.slice(0,8)}... challenged you</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await acceptChallenge(c.challengeId);
                  navigate('/playground'); // Go to playground where battle will start
                }}
                className="flex-1 rounded-lg bg-warning py-2 text-xs font-bold text-warning-foreground"
              >
                Accept
              </button>
              <button
                onClick={() => dismissChallenge(c.challengeId)}
                className="flex-1 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted"
              >
                Ignore
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ChatNotification() {
  const { chatNotifications, dismissChatNotification } = useSignalR();
  const navigate = useNavigate();

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {chatNotifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ x: 120, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 120, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="group cursor-pointer rounded-xl border border-primary/20 bg-surface/95 p-4 shadow-elevated backdrop-blur-lg"
            onClick={() => {
              dismissChatNotification(n.id);
              navigate('/community');
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground">{n.fromUserName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissChatNotification(n.id);
                    }}
                    className="shrink-0 rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.message}</p>
                <div className="mt-1.5 text-[10px] text-primary/60">Click to open chat →</div>
              </div>
            </div>
            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              className="mt-3 h-0.5 origin-left rounded-full bg-primary/30"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Header({ pathname }: { pathname: string }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Algo<span className="text-primary">Scope</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'relative rounded-md px-3 py-1.5 font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-md border border-primary/20 bg-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden max-w-md flex-1 lg:block">
          <button
            type="button"
            onClick={() => navigate('/topics')}
            className="flex h-9 w-full items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40"
          >
            <Search className="h-4 w-4" />
            <span>Search or jump…</span>
            <span className="ml-auto flex items-center gap-1 text-xs">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">⌘</kbd>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">K</kbd>
            </span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/progress' : '/login')}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground sm:flex"
            aria-label="Open progress notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground sm:inline">
                <User className="mr-1 inline h-3.5 w-3.5 align-middle" />
                {user.displayName || user.email}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
            >
              Sign In <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <Command className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono">algoscope.dev</span>
          <span className="text-border">/</span>
          <span>v1.0.0-edge</span>
        </div>
        <div className="flex items-center gap-6">
          <Link className="transition-colors hover:text-primary" to="/topics">
            Topics
          </Link>
          <Link className="transition-colors hover:text-primary" to="/problems">
            Problems
          </Link>
          <Link className="transition-colors hover:text-primary" to="/playground">
            Playground
          </Link>
          <Link className="transition-colors hover:text-primary" to="/community">
            Community
          </Link>
          <Link className="transition-colors hover:text-primary" to="/path">
            Paths
          </Link>
          <a className="transition-colors hover:text-primary" href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
