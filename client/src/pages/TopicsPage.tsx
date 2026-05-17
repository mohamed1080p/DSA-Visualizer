import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Boxes,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { fadeUp, stagger } from '@/motion-variants';
import { cn } from '@/lib/utils';
import { ApiError, apiJson } from '@/lib/api-client';

type TopicRow = {
  id: number;
  title: string;
  description: string;
  slug: string;
  difficulty: string;
  categoryName: string;
};

const LEVEL_COLOR: Record<string, string> = {
  Easy: 'bg-success/15 text-success border-success/30',
  Medium: 'bg-warning/15 text-warning border-warning/30',
  Hard: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function TopicsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [active, setActive] = useState('All Topics');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [allTopics, setAllTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await apiJson<TopicRow[]>('/api/Topics');
          if (!cancelled) setAllTopics(data);
        } catch (e) {
          if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load topics.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTopics) {
      map.set(t.categoryName, (map.get(t.categoryName) ?? 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return [{ name: 'All Topics', count: allTopics.length }, ...sorted.map(([name, count]) => ({ name, count }))];
  }, [allTopics]);

  const normalizeDifficulty = (d: string | number) => {
    const val = String(d);
    if (val === '1' || val.toLowerCase() === 'easy') return 'Easy';
    if (val === '2' || val.toLowerCase() === 'medium') return 'Medium';
    if (val === '3' || val.toLowerCase() === 'hard') return 'Hard';
    return val;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTopics.filter((t) => {
      const topicCategory = t.categoryName?.trim() || 'General';
      const topicDifficulty = normalizeDifficulty(t.difficulty);

      if (active !== 'All Topics' && topicCategory.toLowerCase() !== active.toLowerCase()) return false;
      if (difficulty !== 'All' && topicDifficulty !== difficulty) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allTopics, active, difficulty, search]);

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-1">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Categories</div>
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setActive(c.name)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                  active === c.name
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'border border-transparent text-muted-foreground hover:bg-surface hover:text-foreground',
                )}
              >
                <span>{c.name}</span>
                <span className="font-mono text-xs">{c.count}</span>
              </button>
            ))}
            <div className="relative mt-6 overflow-hidden rounded-xl border border-primary/30 bg-gradient-surface p-4">
              <div className="absolute inset-0 bg-[var(--gradient-glow)] opacity-40" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Live API</span>
                  <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground">DATA</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Topics load from <span className="font-mono text-primary">GET /api/Topics</span>. Run the API on port 5258 or set{' '}
                  <span className="font-mono">VITE_API_BASE_URL</span>.
                </p>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search topics…"
                  className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm transition focus:border-primary/50 focus:outline-none"
                />
              </div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus:border-primary/50 focus:outline-none"
              >
                <option value="All">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <div className="flex overflow-hidden rounded-md border border-border bg-surface">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Show topics as grid"
                  className={cn('flex h-10 w-10 items-center justify-center', view === 'grid' && 'bg-primary/15 text-primary')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="Show topics as list"
                  className={cn('flex h-10 w-10 items-center justify-center', view === 'list' && 'bg-primary/15 text-primary')}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading topics…
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>
            )}

            {!loading && !error && (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className={cn('grid gap-4', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}
              >
                {filtered.map((t) => (
                  <motion.div key={t.id} variants={fadeUp}>
                    <Link
                      to={`/topics/${t.slug}`}
                      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                            <Boxes className="h-5 w-5 text-primary" />
                          </div>
                          <div className="font-semibold">{t.title}</div>
                        </div>
                        <span
                          className={cn(
                            'rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider',
                            LEVEL_COLOR[normalizeDifficulty(t.difficulty)] ?? 'border-border bg-background',
                          )}
                        >
                          {normalizeDifficulty(t.difficulty)}
                        </span>
                      </div>
                      <p className="mt-3 flex-1 text-sm text-muted-foreground">{t.description}</p>
                      <div className="mt-4 font-mono text-xs text-muted-foreground">{t.categoryName}</div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">No topics match your filters.</p>
            )}
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
