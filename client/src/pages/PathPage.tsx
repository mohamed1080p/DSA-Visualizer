import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import {
  Sprout,
  Compass,
  Mountain,
  Crown,
  CheckCircle2,
  Lock,
  PlayCircle,
  Boxes,
  Code,
  Layers,
  Search as SearchIcon,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { fadeUp, stagger } from '@/motion-variants';
import { cn } from '@/lib/utils';
import { ApiError, apiJson } from '@/lib/api-client';
import { useAuth } from '@/context/use-auth';

type LearningPathDTO = {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  totalLevels: number;
  completedLevels: number;
  isStarted: boolean;
};

type LearningPathLevelDTO = {
  id: number;
  title: string;
  order: number;
  type: string;
  slug?: string | null;
  difficulty?: string | null;
  isCompleted: boolean;
  isLocked: boolean;
};

type LearningPathDetailDTO = {
  title: string;
  slug: string;
  description: string;
  totalLevels: number;
  completedLevels: number;
  isStarted: boolean;
  levels: LearningPathLevelDTO[];
};

const ICON_MAP: Record<string, typeof Boxes> = {
  code: Code,
  layers: Layers,
  search: SearchIcon,
  sprout: Sprout,
  compass: Compass,
  mountain: Mountain,
  crown: Crown,
};

function pathIcon(key: string) {
  const k = key.toLowerCase();
  return ICON_MAP[k] ?? Boxes;
}

const PATH_LEVEL_COLOR: Record<string, string> = {
  Beginner: 'from-success/30 to-success/5',
  Intermediate: 'from-info/30 to-info/5',
  Advanced: 'from-warning/30 to-warning/5',
  Expert: 'from-primary/30 to-primary/5',
};

function levelLabelFromProgress(completed: number, total: number): string {
  if (total <= 0) return '—';
  if (completed >= total) return 'Expert';
  const r = completed / total;
  if (r < 0.33) return 'Beginner';
  if (r < 0.66) return 'Intermediate';
  return 'Advanced';
}

function roadmapStatus(levels: LearningPathLevelDTO[], idx: number): 'done' | 'active' | 'next' | 'locked' {
  const sorted = [...levels].sort((a, b) => a.order - b.order);
  const l = sorted[idx];
  if (!l) return 'locked';
  if (l.isCompleted) return 'done';
  if (l.isLocked) return 'locked';
  const firstOpen = sorted.findIndex((x) => !x.isCompleted && !x.isLocked);
  if (idx === firstOpen) return 'active';
  if (firstOpen === -1) return 'done';
  if (idx < firstOpen) return 'done';
  return 'next';
}

export default function PathPage() {
  const { isAuthenticated } = useAuth();
  const [paths, setPaths] = useState<LearningPathDTO[]>([]);
  const [detail, setDetail] = useState<LearningPathDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [busyLevel, setBusyLevel] = useState<number | null>(null);

  const refresh = useCallback(async (preferredSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiJson<LearningPathDTO[]>('/api/LearningPaths', { auth: isAuthenticated });
      setPaths(list);
      const active = list.find((p) => p.slug === (preferredSlug ?? selectedSlug)) ?? list.find((p) => p.isStarted) ?? list[0];
      if (active) {
        const d = await apiJson<LearningPathDetailDTO>(`/api/LearningPaths/${encodeURIComponent(active.slug)}`, {
          auth: isAuthenticated,
        });
        setDetail(d);
        setSelectedSlug(active.slug);
      } else {
        setDetail(null);
        setSelectedSlug(null);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load learning paths.');
      setPaths([]);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedSlug]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  async function startPath(slug: string) {
    if (!isAuthenticated) return;
    setBusySlug(slug);
    try {
      await apiJson(`/api/LearningPaths/${encodeURIComponent(slug)}/start`, { method: 'POST', auth: true });
      await refresh(slug);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start path.');
    } finally {
      setBusySlug(null);
    }
  }

  async function selectPath(slug: string) {
    await refresh(slug);
  }

  async function completeLevel(levelOrder: number) {
    if (!isAuthenticated || !detail) return;
    setBusyLevel(levelOrder);
    setError(null);
    try {
      await apiJson(`/api/LearningPaths/${encodeURIComponent(detail.slug)}/complete/${levelOrder}`, {
        method: 'POST',
        auth: true,
      });
      await refresh(detail.slug);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not complete this level.');
    } finally {
      setBusyLevel(null);
    }
  }

  const sortedLevels = detail ? [...detail.levels].sort((a, b) => a.order - b.order) : [];
  const progressPct = detail && detail.totalLevels > 0 ? Math.round((100 * detail.completedLevels) / detail.totalLevels) : 0;

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-3 font-mono text-xs text-primary">// LEARNING_PATHS</div>
            <h1 className="font-display text-5xl font-bold tracking-tight">
              From <span className="text-gradient-primary">zero to mastery</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Curated paths from the API. Sign in to start a path and sync progress.
            </p>
          </div>

          {loading && (
            <div className="mb-8 flex justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" /> Loading paths…
            </div>
          )}
          {error && <div className="mb-8 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-center text-destructive">{error}</div>}

          <motion.div variants={stagger} initial="hidden" animate="show" className="mb-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paths.map((p) => {
              const Icon = pathIcon(p.icon);
              const pct = p.totalLevels > 0 ? Math.round((100 * p.completedLevels) / p.totalLevels) : 0;
              const level = levelLabelFromProgress(p.completedLevels, p.totalLevels);
              const color = PATH_LEVEL_COLOR[level] ?? PATH_LEVEL_COLOR.Beginner;
              return (
                <motion.div key={p.id} variants={fadeUp}>
                  <div
                    className={cn(
                      'group relative h-full overflow-hidden rounded-2xl border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-primary/40',
                      selectedSlug === p.slug ? 'border-primary/50' : 'border-border',
                    )}
                  >
                    <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50', color)} />
                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{level}</div>
                        <h3 className="mt-1 font-display text-xl font-bold">{p.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                      </div>
                      <div className="mt-4 font-mono text-xs text-muted-foreground">
                        {p.completedLevels}/{p.totalLevels} levels · {p.isStarted ? 'In progress' : 'Not started'}
                      </div>
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-mono text-primary">{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-background">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="h-full bg-gradient-primary"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void selectPath(p.slug)}
                        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-background/70 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        View path <ArrowRight className="h-4 w-4" />
                      </button>
                      {isAuthenticated && !p.isStarted && (
                        <button
                          type="button"
                          disabled={busySlug === p.slug}
                          onClick={() => void startPath(p.slug)}
                          className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                        >
                          {busySlug === p.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                          Start path
                        </button>
                      )}
                      {!isAuthenticated && (
                        <p className="mt-3 text-center text-xs text-muted-foreground">Sign in to start this path.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {detail && (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="relative">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="mb-2 font-mono text-xs text-primary">ACTIVE_PATH/</div>
                    <h2 className="font-display text-3xl font-bold">{detail.title}</h2>
                    <p className="mt-1 text-muted-foreground">
                      {detail.completedLevels} of {detail.totalLevels} levels · {progressPct}% complete
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute bottom-6 left-6 top-6 w-0.5 bg-border" />
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {sortedLevels.map((r, idx) => {
                      const status = roadmapStatus(sortedLevels, idx);
                      const isDone = status === 'done';
                      const isActive = status === 'active';
                      const isLocked = status === 'locked';
                      const StepIcon = Boxes;
                      const target = r.type === 'topic' && r.slug ? `/topics/${r.slug}` : r.slug ? `/problems/${r.slug}` : '/problems';
                      const canAct = isAuthenticated && detail.isStarted && !isLocked && !isDone;
                      return (
                        <motion.div key={r.id} variants={fadeUp} className="relative pl-16">
                          <div
                            className={cn(
                              'absolute left-0 top-2 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2',
                              isDone && 'border-success bg-success/20 text-success',
                              isActive && 'animate-pulse-glow border-primary bg-primary/20 text-primary',
                              status === 'next' && 'border-border bg-surface text-muted-foreground',
                              isLocked && 'border-border bg-background text-muted-foreground',
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : isActive ? (
                              <PlayCircle className="h-5 w-5" />
                            ) : isLocked ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <StepIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div
                            className={cn(
                              'flex items-center gap-4 rounded-xl border p-4 transition-all',
                              isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/50',
                              isLocked && 'opacity-60',
                            )}
                          >
                            <StepIcon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 font-semibold">
                                {r.title}
                                <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                                  {r.type}
                                </span>
                                {isActive && (
                                  <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground">NOW</span>
                                )}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                Order {r.order}
                                {r.slug ? ` · ${r.slug}` : ''}
                              </div>
                            </div>
                            {!isLocked && (
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <Link
                                  to={target}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                  Open <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                                {canAct && (
                                  <button
                                    type="button"
                                    disabled={busyLevel === r.order}
                                    onClick={() => void completeLevel(r.order)}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-all hover:shadow-glow disabled:opacity-60"
                                  >
                                    {busyLevel === r.order ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    Complete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
