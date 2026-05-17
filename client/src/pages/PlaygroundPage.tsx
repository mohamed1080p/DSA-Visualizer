import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import {
  Swords,
  Trophy,
  History,
  Zap,
  Shield,
  Crown,
  Target,
  Users,
  Timer,
  Code2,
  Award,
  TrendingUp,
  Sparkles,
  Loader2,
  Flame,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { fadeUp, stagger } from '@/motion-variants';
import { cn } from '@/lib/utils';
import { ApiError, apiJson } from '@/lib/api-client';
import { useAuth } from '@/context/use-auth';
import { useSignalR } from '@/context/SignalRContext';
import VictoryOverlay from '@/components/VictoryOverlay';

const TABS = ['Matchmaking', 'Leaderboard', 'History'] as const;
type Tab = (typeof TABS)[number];
type BattleModeValue = 1 | 2 | 3;

type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  rankPoints: number;
  level: number;
  winCount: number;
  lossCount: number;
  currentStreak: number;
  winRate: number;
};

type BattleStats = {
  rankPoints: number;
  level: number;
  winCount: number;
  lossCount: number;
  drawCount: number;
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  totalBattles: number;
  preferredLanguage?: string | number;
};

type QueueStatus = { queued: boolean; battleId?: string | null };
type QueueResult = { queued: boolean; battleId?: string | null; mode: string };
type BattleHistoryRow = {
  id: string;
  mode: string | number;
  status: string | number;
  createdAt: string;
  winnerUserId?: string | null;
  problems: { title: string; difficulty: string }[];
  participants: { userId: string; displayName: string; solvedCount: number; ratingDelta: number }[];
};

const MODES: { label: string; value: BattleModeValue; icon: typeof Zap; detail: string }[] = [
  { label: 'First to solve', value: 1, icon: Zap, detail: 'Best of three problems' },
  { label: 'Timed', value: 2, icon: Shield, detail: 'Ten minute sprint' },
  { label: 'Survival', value: 3, icon: Crown, detail: 'One mistake hurts' },
];

function formatMode(mode: string | number) {
  if (mode === 1 || mode === '1') return 'First to solve';
  if (mode === 2 || mode === '2') return 'Timed';
  if (mode === 3 || mode === '3') return 'Survival';
  return String(mode);
}


function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getModeIcon(tab: Tab) {
  if (tab === 'Matchmaking') return Swords;
  if (tab === 'Leaderboard') return Trophy;
  return History;
}

function getMatchmakingTitle(battleId: string | null, searching: boolean) {
  if (battleId) return 'Match found';
  if (searching) return 'Searching for opponent';
  return 'Ready to queue';
}

function getMatchmakingDescription(battleId: string | null, searching: boolean, selectedMode: BattleModeValue, seconds: number) {
  if (battleId) {
    return `Battle ${battleId} is ready. The backend has created the session.`;
  }

  if (searching) {
    return `Queued for ${formatMode(selectedMode)}. Waiting ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.`;
  }

  return 'Choose a mode and join the backend matchmaking queue.';
}

function getMatchButtonLabel(busy: boolean, searching: boolean) {
  if (busy) return <Loader2 className="h-5 w-5 animate-spin" />;
  if (searching) return 'Cancel queue';
  return <><Flame className="h-5 w-5" /> Find match</>;
}

function isAlreadyQueuedError(error: unknown) {
  return error instanceof ApiError && error.status === 400 && error.message.toLowerCase().includes('already in queue');
}

async function refreshBattleFromQueueState(
  queueState: QueueStatus,
  setSearching: (value: boolean) => void,
  setBattleId: (value: string | null) => void,
  setBattle: (battle: any) => void,
) {
  setSearching(queueState.queued);

  if (!queueState.battleId) {
    return;
  }

  const battle = await apiJson<any>(`/api/Battle/${queueState.battleId}`, { auth: true });
  setBattle(battle);
  setBattleId(queueState.battleId);
}

export default function PlaygroundPage() {
  const [tab, setTab] = useState<Tab>('Matchmaking');
  const { user } = useAuth();
  const { battleResult, clearBattleResult } = useSignalR();

  // Determine outcome from battleResult
  const battleOutcome = useMemo<'win' | 'loss' | 'draw' | null>(() => {
    if (!battleResult) return null;
    const winnerId = battleResult.winnerUserId;
    if (!winnerId) return 'draw';
    if (winnerId === user?.userId) return 'win';
    return 'loss';
  }, [battleResult, user?.userId]);

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 font-mono text-xs text-primary">{'// BATTLE_ARENA'}</div>
              <h1 className="flex items-center gap-3 font-display text-4xl font-bold">
                <Swords className="h-8 w-8 text-primary" />
                Algorithm Battles
              </h1>
              <p className="mt-2 text-muted-foreground">Queue for real backend matchmaking, track rank, and review battle history.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => {
                const Icon = getModeIcon(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-all',
                      tab === t
                        ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                        : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" /> {t}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'Matchmaking' && <MatchmakingPanel key="m" />}
            {tab === 'Leaderboard' && <LeaderboardPanel key="l" />}
            {tab === 'History' && <HistoryPanel key="h" />}
          </AnimatePresence>
        </div>

        {/* Victory / Defeat overlay (shown if redirected here with a pending result) */}
        {battleOutcome && (
          <VictoryOverlay
            outcome={battleOutcome}
            onClose={clearBattleResult}
          />
        )}
      </PageTransition>
    </AppShell>
  );
}

function MatchmakingPanel() {
  const { isAuthenticated } = useAuth();
  const { setBattle } = useSignalR();
  const [selectedMode, setSelectedMode] = useState<BattleModeValue>(1);
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [searching, setSearching] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        try {
          const [s, q] = await Promise.all([
            apiJson<BattleStats>('/api/Battle/stats', { auth: true }),
            apiJson<QueueStatus>('/api/Battle/queue/status', { auth: true }),
          ]);
          if (!cancelled) {
            setStats(s);
            setSearching(q.queued);
            if (q.battleId) {
              const battle = await apiJson<any>(`/api/Battle/${q.battleId}`, { auth: true });
              setBattle(battle);
            }
          }
        } catch (e) {
          if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load battle profile.');
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!searching) return;
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [searching]);

  // While queued via REST only, the other player's POST triggers the match on the server.
  // This tab never gets that response, so poll until queue/status reports an active battleId.
  useEffect(() => {
    if (!isAuthenticated || !searching) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const q = await apiJson<QueueStatus>('/api/Battle/queue/status', { auth: true });
        if (cancelled) return;

        if (q.battleId) {
          await refreshBattleFromQueueState(q, setSearching, setBattleId, setBattle);
          setSeconds(0);
          return;
        }

        if (!q.queued) {
          setSearching(false);
          setSeconds(0);
        }
      } catch {
        /* transient network errors while polling */
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [searching, isAuthenticated, setBattle]);

  async function toggleMatch() {
    if (!isAuthenticated) return;
    setBusy(true);
    setError(null);
    setBattleId(null);
    try {
      if (searching) {
        await apiJson('/api/Battle/queue', { method: 'DELETE', auth: true });
        setSearching(false);
        setSeconds(0);
        return;
      }

      const result = await apiJson<QueueResult>('/api/Battle/queue', {
        method: 'POST',
        auth: true,
        json: { mode: selectedMode },
      });
      
      // If an active battle was returned (not queued, but has battleId), sync into it
      if (!result.queued && result.battleId) {
        const battle = await apiJson<any>(`/api/Battle/${result.battleId}`, { auth: true });
        setBattle(battle);
        setBattleId(null);
      } else {
        setSearching(result.queued);
        setBattleId(result.battleId ?? null);
      }
      setSeconds(0);
    } catch (e) {
      if (isAlreadyQueuedError(e)) {
        try {
          const q = await apiJson<QueueStatus>('/api/Battle/queue/status', { auth: true });
          await refreshBattleFromQueueState(q, setSearching, setBattleId, setBattle);
        } catch {
          setSearching(true);
        }
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not update matchmaking queue.');
      }
    } finally {
      setBusy(false);
    }
  }

  const wins = stats?.winCount ?? 0;
  const losses = stats?.lossCount ?? 0;
  const draws = stats?.drawCount ?? 0;
  const total = stats?.totalBattles ?? wins + losses + draws;
  const winRate = stats ? Math.round(stats.winRate) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-[1fr_380px]"
    >
      <div className="relative grid-bg overflow-hidden rounded-2xl border border-border bg-gradient-surface">
        <div className="absolute inset-0 bg-[var(--gradient-glow)] opacity-50" />
        <div className="relative flex min-h-[480px] flex-col items-center justify-center p-10 text-center">
          <motion.div
            animate={searching ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-primary/40"
          >
            {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Swords className="h-8 w-8 text-primary" />}
          </motion.div>
          <h2 className="mt-5 font-display text-3xl font-bold">{getMatchmakingTitle(battleId, searching)}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {getMatchmakingDescription(battleId, searching, selectedMode, seconds)}
          </p>

          {error && <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}

          {isAuthenticated ? (
            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => void toggleMatch()}
                className={cn(
                  'flex h-14 items-center gap-3 rounded-md px-10 font-display text-lg font-bold transition-all disabled:opacity-60',
                  searching
                    ? 'border border-destructive/40 bg-destructive/20 text-destructive hover:bg-destructive/30'
                    : 'animate-pulse-glow bg-primary text-primary-foreground hover:scale-105',
                )}
              >
                {getMatchButtonLabel(busy, searching)}
              </button>
              
              {!searching && !battleId && (
                <button
                  type="button"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const result = await apiJson<any>('/api/Battle/challenge/bot', { method: 'POST', auth: true, json: { mode: selectedMode } });
                      setBattle(result);
                    } catch (error) {
                      setError(error instanceof Error ? error.message : 'Bot practice failed to start.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Crown className="h-4 w-4" /> Practice with AI Challenger
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="mt-8 flex h-14 items-center gap-3 rounded-md bg-primary px-10 font-display text-lg font-bold text-primary-foreground transition-all hover:shadow-glow"
            >
              Sign in to queue
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 font-mono text-xs text-primary">YOUR_RANK/</div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary font-display text-2xl font-bold text-primary-foreground">
              {stats?.level ?? 1}
            </div>
            <div>
              <div className="font-display text-2xl font-bold">Level {stats?.level ?? 1}</div>
              <div className="font-mono text-sm text-muted-foreground">{stats?.rankPoints ?? 1000} rating points</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <div className="font-mono text-xs text-primary">QUICK_STATS/</div>
          {[
            { icon: Trophy, l: 'Win rate', v: `${winRate}%`, color: 'text-success' },
            { icon: Flame, l: 'Current streak', v: String(stats?.currentStreak ?? 0), color: 'text-warning' },
            { icon: Target, l: 'Best streak', v: String(stats?.bestStreak ?? 0), color: 'text-info' },
            { icon: Users, l: 'Battles', v: String(total), color: 'text-primary' },
          ].map((s) => (
            <div key={s.l} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <s.icon className={cn('h-4 w-4', s.color)} /> {s.l}
              </div>
              <div className="font-mono font-semibold">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 font-mono text-xs text-primary">GAME_MODES/</div>
          <div className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedMode(m.value)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors',
                  selectedMode === m.value ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30',
                )}
              >
                <m.icon className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.detail}</div>
                </div>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardPanel() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const rows = await apiJson<LeaderboardEntry[]>('/api/Leaderboard/global?page=1&pageSize=20');
          if (!cancelled) setLeaders(rows);
        } catch (e) {
          if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load leaderboard.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="border-b border-border p-6">
        <div className="font-mono text-xs text-primary">GLOBAL_LEADERBOARD/</div>
        <p className="mt-2 text-sm text-muted-foreground">Loaded from GET /api/Leaderboard/global.</p>
      </div>
      {loading && <div className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading leaderboard</div>}
      {error && <div className="m-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}
      {!loading && !error && (
        <motion.div variants={stagger} initial="hidden" animate="show">
          <div className="grid grid-cols-[70px_1fr_120px_100px_100px] border-b border-border px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <div>Rank</div>
            <div>Player</div>
            <div className="text-right">Rating</div>
            <div className="text-right">Wins</div>
            <div className="text-right">Win rate</div>
          </div>
          {leaders.length === 0 && <p className="p-6 text-sm text-muted-foreground">No leaderboard entries yet.</p>}
          {leaders.map((p) => (
            <motion.div
              key={p.userId}
              variants={fadeUp}
              className="grid grid-cols-[70px_1fr_120px_100px_100px] items-center border-b border-border px-6 py-3 text-sm transition-colors hover:bg-background/50"
            >
              <div className="flex items-center gap-1 font-display font-bold">
                {p.rank <= 3 && <Award className="h-4 w-4 text-warning" />}
                <span className={p.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}>#{p.rank}</span>
              </div>
              <div className="truncate font-medium">{p.displayName}</div>
              <div className="text-right font-mono text-primary">{p.rankPoints}</div>
              <div className="text-right font-mono text-muted-foreground">{p.winCount}</div>
              <div className="text-right font-mono text-muted-foreground">{Math.round(p.winRate)}%</div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function HistoryPanel() {
  const { isAuthenticated, user } = useAuth();
  const [history, setHistory] = useState<BattleHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const rows = await apiJson<BattleHistoryRow[]>('/api/Battle/history?page=1&pageSize=20', { auth: true });
          if (!cancelled) setHistory(rows);
        } catch (e) {
          if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load battle history.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl border border-border bg-surface p-8 text-center">
        <History className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-3 font-display text-2xl font-bold">Sign in to view battle history</h2>
        <Link to="/login" className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Sign in
        </Link>
      </motion.div>
    );
  }

  // Only show completed battles (Finished = 3, Abandoned = 5)
  const completedHistory = history.filter((h) => {
    const s = h.status;
    return s === 3 || s === '3' || s === 5 || s === '5';
  });

  function getMatchOutcome(row: BattleHistoryRow): 'win' | 'loss' | 'draw' {
    if (!row.winnerUserId) return 'draw';
    return row.winnerUserId === user?.userId ? 'win' : 'loss';
  }

  const wins = completedHistory.filter((h) => getMatchOutcome(h) === 'win').length;
  const losses = completedHistory.filter((h) => getMatchOutcome(h) === 'loss').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          { i: Trophy, l: 'Total', v: completedHistory.length, c: 'text-primary' },
          { i: TrendingUp, l: 'Wins', v: wins, c: 'text-success' },
          { i: Sparkles, l: 'Losses', v: losses, c: 'text-destructive' },
          { i: Code2, l: 'Problems', v: completedHistory.reduce((sum, h) => sum + h.problems.length, 0), c: 'text-info' },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
              <s.i className={cn('h-5 w-5', s.c)} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="font-display text-xl font-bold">{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-6">
          <div className="font-mono text-xs text-primary">BATTLE_HISTORY/</div>
          <p className="mt-2 text-sm text-muted-foreground">Your completed battles — wins and losses.</p>
        </div>
        {loading && <div className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading history</div>}
        {error && <div className="m-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}
        {!loading && !error && completedHistory.length === 0 && <p className="p-6 text-sm text-muted-foreground">No completed battles yet. Queue for a match to start building history.</p>}
        {!loading && !error && completedHistory.length > 0 && (
          <motion.div variants={stagger} initial="hidden" animate="show">
            {completedHistory.map((h) => {
              const outcome = getMatchOutcome(h);
              return (
                <motion.div
                  key={h.id}
                  variants={fadeUp}
                  className="grid gap-2 border-b border-border px-6 py-4 text-sm md:grid-cols-[1fr_120px_100px_160px]"
                >
                  <div>
                    <div className="font-medium">{h.problems[0]?.title ?? 'Battle session'}</div>
                    <div className="text-xs text-muted-foreground">{h.participants.map((p) => p.displayName).join(' vs ')}</div>
                  </div>
                  <div className="font-mono text-muted-foreground">{formatMode(h.mode)}</div>
                  <div>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider',
                      outcome === 'win'
                        ? 'bg-success/15 text-success border border-success/30'
                        : outcome === 'loss'
                          ? 'bg-destructive/15 text-destructive border border-destructive/30'
                          : 'bg-muted text-muted-foreground border border-border'
                    )}>
                      {outcome === 'win' && <Trophy className="h-3 w-3" />}
                      {outcome === 'win' ? 'Victory' : outcome === 'loss' ? 'Defeat' : 'Draw'}
                    </span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground md:text-left">{formatWhen(h.createdAt)}</div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
