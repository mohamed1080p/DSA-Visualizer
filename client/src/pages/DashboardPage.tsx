import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Bookmark,
  Send,
  BarChart3,
  Settings,
  CalendarDays,
  CheckCircle2,
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { fadeUp, stagger } from '@/motion-variants';
import { cn } from '@/lib/utils';
import { ApiError, apiJson } from '@/lib/api-client';
import { useAuth } from '@/context/use-auth';

const NAV = [
  { i: LayoutDashboard, l: 'Overview' },
  { i: Send, l: 'Submissions' },
  { i: BarChart3, l: 'Stats' },
  { i: Bookmark, l: 'Bookmarks' },
  { i: Settings, l: 'Settings' },
];

type UserProgress = {
  totalProblemsSolved: number;
  totalTopicsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalProblemsCount: number;
  totalTopicsCount: number;
  easyProblemsSolved: number;
  mediumProblemsSolved: number;
  hardProblemsSolved: number;
  totalEasyProblems: number;
  totalMediumProblems: number;
  totalHardProblems: number;
  recentSolves: { problemTitle: string; problemSlug: string; difficulty: string; solvedAt: string }[];
};

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

type SubmissionHistory = {
  id: number;
  status: string;
  verdict: string;
  failureReason?: string;
  language: string;
  runtimeMs?: number | null;
  memoryKb?: number | null;
  submittedAt: string;
  problemSlug: string;
  problemTitle: string;
};

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (86400 * 1000));
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildContributionWeeks(history: SubmissionHistory[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startWindow = new Date(today);
  startWindow.setDate(today.getDate() - 364);
  const startGrid = new Date(startWindow);
  startGrid.setDate(startGrid.getDate() - startGrid.getDay());

  const counts = new Map<string, number>();
  for (const h of history) {
    if (h.verdict !== 'Accepted') continue;
    const d = new Date(h.submittedAt);
    if (Number.isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    if (d < startWindow || d > today) continue;
    const key = dateKey(d);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: { date: Date; key: string; count: number; inWindow: boolean }[] = [];
  for (const d = new Date(startGrid); d <= today; d.setDate(d.getDate() + 1)) {
    const copy = new Date(d);
    const key = dateKey(copy);
    days.push({ date: copy, key, count: counts.get(key) ?? 0, inWindow: copy >= startWindow });
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    days.push({ date: next, key: dateKey(next), count: 0, inWindow: false });
  }

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  return { weeks, total };
}

function contributionClass(count: number, inWindow: boolean) {
  if (!inWindow) return 'bg-background/40';
  if (count === 0) return 'bg-muted/60';
  if (count === 1) return 'bg-success/25';
  if (count === 2) return 'bg-success/45';
  if (count === 3) return 'bg-success/65';
  return 'bg-success';
}

function ContributionHeatmap({
  weeks,
  total,
}: {
  weeks: ReturnType<typeof buildContributionWeeks>['weeks'];
  total: number;
}) {
  const monthLabels = weeks.map((week, idx) => {
    const first = week[0]?.date;
    const previous = weeks[idx - 1]?.[0]?.date;
    if (!first) return '';
    if (idx > 0 && previous?.getMonth() === first.getMonth()) return '';
    return first.toLocaleString(undefined, { month: 'short' });
  });

  return (
    <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-2">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 font-mono text-xs text-primary">
            <CalendarDays className="h-3.5 w-3.5" /> SOLVING_ACTIVITY/
          </div>
          <div className="font-display text-3xl font-bold">{total} contributions in the last year</div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={cn('h-3.5 w-3.5 rounded-sm', contributionClass(n, true))} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[940px]">
          <div
            className="mb-2 grid gap-1 pl-12 text-sm text-muted-foreground"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(12px, 1fr))` }}
          >
            {monthLabels.map((label, idx) => (
              <div key={`${label}-${idx}`} className="h-4">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[40px_1fr] gap-3">
            <div className="grid grid-rows-7 text-sm leading-4 text-muted-foreground">
              <span />
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
            </div>
            <div
              className="grid grid-flow-col grid-rows-7 gap-1"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(12px, 1fr))` }}
            >
              {weeks.flat().map((day) => (
                <span
                  key={day.key}
                  title={`${day.key}: ${day.count} accepted submission${day.count === 1 ? '' : 's'}`}
                  className={cn('aspect-square w-full rounded-[4px]', contributionClass(day.count, day.inWindow))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [panel, setPanel] = useState('Overview');
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const [p, lb, submissions] = await Promise.all([
            apiJson<UserProgress>('/api/UserProgress', { auth: true }),
            apiJson<LeaderboardEntry[]>('/api/Leaderboard/global?page=1&pageSize=8'),
            apiJson<SubmissionHistory[]>('/api/Submissions/history', { auth: true }),
          ]);
          if (!cancelled) {
            setProgress(p);
            setLeaderboard(lb);
            setSubmissionHistory(submissions);
          }
        } catch (e) {
          if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load progress.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pct = (n: number, d: number) => (d > 0 ? Math.round((100 * n) / d) : 0);
  const contributions = useMemo(() => buildContributionWeeks(submissionHistory), [submissionHistory]);

  const stats = progress
    ? [
        {
          l: 'Problems solved',
          v: String(progress.totalProblemsSolved),
          sub: `${pct(progress.totalProblemsSolved, progress.totalProblemsCount)}% of catalog`,
          icon: CheckCircle2,
          color: 'text-success',
        },
        {
          l: 'Topics completed',
          v: String(progress.totalTopicsCompleted),
          sub: `of ${progress.totalTopicsCount} topics`,
          icon: Trophy,
          color: 'text-primary',
        },
        {
          l: 'Current streak',
          v: `${progress.currentStreak} days`,
          sub: `best ${progress.longestStreak} days`,
          icon: Flame,
          color: 'text-warning',
        },
        {
          l: 'Easy / Med / Hard',
          v: `${progress.easyProblemsSolved}/${progress.mediumProblemsSolved}/${progress.hardProblemsSolved}`,
          sub: `totals ${progress.totalEasyProblems}/${progress.totalMediumProblems}/${progress.totalHardProblems}`,
          icon: Clock,
          color: 'text-info',
        },
      ]
    : [];

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-1">
            {NAV.map((n) => (
              <button
                key={n.l}
                type="button"
                onClick={() => setPanel(n.l)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors',
                  panel === n.l
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-surface hover:text-foreground',
                )}
              >
                <n.i className="h-4 w-4" /> {n.l}
              </button>
            ))}
          </aside>

          <div>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-1 font-mono text-xs text-primary">PROGRESS/</div>
                <h1 className="font-display text-3xl font-bold">
                  {panel === 'Overview' ? 'Progress' : panel}
                  {panel === 'Overview' && user?.displayName ? ` for ${user.displayName}` : ''}
                </h1>
              </div>
              <Link
                to="/problems"
                className="hidden h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:shadow-glow md:flex"
              >
                Solve problems <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading && (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading progress...
              </div>
            )}
            {error && <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}

            {progress && panel !== 'Overview' && (
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="mb-3 font-mono text-xs text-primary">{panel === 'Submissions' ? 'MY_ATTEMPTS/' : `${panel.toUpperCase()}/`}</div>
                {panel === 'Submissions' ? (
                  <div className="space-y-2">
                    {submissionHistory.length ? (
                      submissionHistory.map((a) => (
                        <div key={a.id} className="grid gap-2 rounded-md border border-border/60 px-3 py-2 text-sm md:grid-cols-[80px_1fr_120px_150px]">
                          <span className="font-mono text-primary">#{a.id}</span>
                          <span>
                            {a.problemTitle || a.problemSlug}
                            {a.failureReason && <span className="mt-1 block truncate font-mono text-[11px] text-destructive">{a.failureReason}</span>}
                          </span>
                          <span className={cn('w-fit rounded border px-2 py-0.5 font-mono text-[10px]', a.verdict === 'Accepted' ? 'border-success/30 bg-success/15 text-success' : 'border-border bg-background text-muted-foreground')}>
                            {a.verdict || a.status}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">{formatWhen(a.submittedAt)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No submissions yet.</p>
                    )}
                  </div>
                ) : panel === 'Stats' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stats.map((s) => (
                      <div key={s.l} className="rounded-md border border-border bg-background p-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
                        <div className="mt-2 font-display text-2xl font-bold text-primary">{s.v}</div>
                        <div className="text-xs text-muted-foreground">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                ) : panel === 'Settings' ? (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Email: <span className="font-mono text-foreground">{user?.email ?? 'Unknown'}</span></p>
                    <p>Display name: <span className="font-mono text-foreground">{user?.displayName ?? user?.userName ?? 'Unknown'}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No saved bookmarks yet. Open a topic and mark progress to build your progress page.</p>
                )}
              </div>
            )}

            {progress && panel === 'Overview' && (
              <>
                <motion.div variants={stagger} initial="hidden" animate="show" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((s) => (
                    <motion.div key={s.l} variants={fadeUp} className="rounded-xl border border-border bg-surface p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
                        <s.icon className={cn('h-4 w-4', s.color)} />
                      </div>
                      <div className="mt-3 font-display text-3xl font-bold">{s.v}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="mb-4 grid gap-4 lg:grid-cols-2">
                  <ContributionHeatmap weeks={contributions.weeks} total={contributions.total} />

                  <div className="rounded-xl border border-border bg-surface p-5">
                    <div className="mb-4 font-mono text-xs text-primary">GLOBAL_LEADERBOARD/</div>
                    <div className="space-y-2">
                      {leaderboard.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
                      {leaderboard.map((row) => (
                        <div key={row.userId} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
                          <span className="font-mono text-primary">#{row.rank}</span>
                          <span className="flex-1 truncate px-2 text-left">{row.displayName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{row.rankPoints} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface p-5">
                    <div className="mb-4 font-mono text-xs text-primary">TOPICS_VS_PROBLEMS/</div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="mb-1 flex justify-between">
                          <span>Topics</span>
                          <span className="font-mono text-primary">
                            {pct(progress.totalTopicsCompleted, progress.totalTopicsCount)}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-background">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct(progress.totalTopicsCompleted, progress.totalTopicsCount)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between">
                          <span>Problems</span>
                          <span className="font-mono text-primary">
                            {pct(progress.totalProblemsSolved, progress.totalProblemsCount)}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-background">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct(progress.totalProblemsSolved, progress.totalProblemsCount)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                            className="h-full bg-gradient-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-5">
                  <div className="mb-4 font-mono text-xs text-primary">RECENT_SOLVES/</div>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                    {progress.recentSolves?.length ? (
                      progress.recentSolves.map((a) => (
                        <motion.div
                          key={`${a.problemSlug}-${a.solvedAt}`}
                          variants={fadeUp}
                          className="flex items-center justify-between rounded-md p-3 transition-colors hover:bg-background/50"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-sm">{a.problemTitle}</span>
                            <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {a.difficulty}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatWhen(a.solvedAt)}</span>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent solves yet. Head to the playground.</p>
                    )}
                  </motion.div>
                </div>
              </>
            )}
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
