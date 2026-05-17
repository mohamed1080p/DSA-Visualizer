import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Code2, Filter, Loader2, Search, Trophy } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { fadeUp, stagger } from '@/motion-variants';
import { ApiError, apiJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type ProblemRow = {
  id: number;
  title: string;
  difficulty: string;
  topicName: string;
  slug: string;
};

const LEVEL_COLOR: Record<string, string> = {
  Easy: 'bg-success/15 text-success border-success/30',
  Medium: 'bg-warning/15 text-warning border-warning/30',
  Hard: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const rows = await apiJson<ProblemRow[]>('/api/Problems');
          if (!cancelled) setProblems(rows);
        } catch (e) {
          if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load problems.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const topics = useMemo(() => ['All', ...Array.from(new Set(problems.map((p) => p.topicName))).sort()], [problems]);

  const normalizeDifficulty = (d: string | number) => {
    const val = String(d);
    if (val === '1' || val.toLowerCase() === 'easy') return 'Easy';
    if (val === '2' || val.toLowerCase() === 'medium') return 'Medium';
    if (val === '3' || val.toLowerCase() === 'hard') return 'Hard';
    return val;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      const probDifficulty = normalizeDifficulty(p.difficulty);
      const probTopic = p.topicName?.trim() || 'General';

      if (difficulty !== 'All' && probDifficulty !== difficulty) return false;
      if (topic !== 'All' && probTopic.toLowerCase() !== topic.toLowerCase()) return false;
      if (q && !p.title.toLowerCase().includes(q) && !probTopic.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [difficulty, problems, search, topic]);

  const solvedLabel = `${filtered.length}/${problems.length}`;

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 font-mono text-xs text-primary">// PROBLEM_SET</div>
              <h1 className="font-display text-4xl font-bold">Practice problems</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Pick a challenge, choose your language, submit code, and let the backend judge it against the test cases.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-display text-2xl font-bold">{solvedLabel}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">visible after filters</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_180px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm transition focus:border-primary/50 focus:outline-none"
              />
            </div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm focus:border-primary/50 focus:outline-none"
            >
              <option value="All">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm focus:border-primary/50 focus:outline-none"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All topics' : t}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading problems...
            </div>
          )}
          {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}

          {!loading && !error && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="grid grid-cols-[1fr_130px_180px_80px] border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <div>Problem</div>
                <div>Difficulty</div>
                <div>Topic</div>
                <div className="text-right">Open</div>
              </div>
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  variants={fadeUp}
                  className="grid grid-cols-[1fr_130px_180px_80px] items-center border-b border-border px-5 py-4 text-sm transition-colors hover:bg-background/50"
                >
                  <Link to={`/problems/${p.slug}`} className="flex min-w-0 items-center gap-3 font-medium hover:text-primary">
                    <Code2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{p.title}</span>
                  </Link>
                  <div>
                    <span className={cn('rounded border px-2 py-1 font-mono text-[10px] uppercase', LEVEL_COLOR[normalizeDifficulty(p.difficulty)] ?? 'border-border bg-background')}>
                      {normalizeDifficulty(p.difficulty)}
                    </span>
                  </div>
                  <div className="truncate text-muted-foreground">{p.topicName}</div>
                  <Link to={`/problems/${p.slug}`} className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-primary" aria-label={`Open ${p.title}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                  <Filter className="h-4 w-4" /> No problems match your filters.
                </div>
              )}
            </motion.div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
