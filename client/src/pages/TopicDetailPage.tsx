import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, Play } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/context/use-auth';
import { ApiError, apiJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type TopicDetail = {
  id: number;
  title: string;
  description: string;
  slug: string;
  explanation: string;
  difficulty: string;
  categoryName: string;
  complexities: { operationName: string; timeComplexity: string; spaceComplexity: string }[];
  codeImplementations: { language: string; code: string; stepsJson: string }[];
};

const LEVEL_COLOR: Record<string, string> = {
  Easy: 'bg-success/15 text-success border-success/30',
  Medium: 'bg-warning/15 text-warning border-warning/30',
  Hard: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function TopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<TopicDetail>(`/api/Topics/${encodeURIComponent(slug)}`);
      setTopic(data);
    } catch (e) {
      setTopic(null);
      setError(e instanceof ApiError ? e.message : 'Could not load topic.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function markComplete() {
    if (!slug || !isAuthenticated) return;
    setCompleteBusy(true);
    setCompleteMsg(null);
    try {
      await apiJson(`/api/Topics/${encodeURIComponent(slug)}/complete`, { method: 'POST', auth: true });
      setCompleteMsg('Marked as completed.');
    } catch (e) {
      setCompleteMsg(e instanceof ApiError ? e.message : 'Could not update progress.');
    } finally {
      setCompleteBusy(false);
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            to="/topics"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> All topics
          </Link>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          )}
          {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}

          {topic && (
            <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <header>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded border border-border px-2 py-0.5 font-mono text-xs">{topic.categoryName}</span>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-xs uppercase tracking-wider',
                      LEVEL_COLOR[topic.difficulty] ?? 'border-border bg-surface',
                    )}
                  >
                    {topic.difficulty}
                  </span>
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight">{topic.title}</h1>
                <p className="mt-3 text-lg text-muted-foreground">{topic.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/visualizer?topic=${topic.slug}`}
                    state={{ topicSlug: topic.slug }}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-4 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Play className="h-4 w-4" />
                    Visualize Topic
                  </Link>

                  {isAuthenticated ? (
                    <button
                      type="button"
                      disabled={completeBusy}
                      onClick={() => void markComplete()}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:shadow-glow disabled:opacity-60"
                    >
                      {completeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark complete
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium transition-colors hover:border-primary/50"
                    >
                      Sign in to track progress
                    </Link>
                  )}
                  {completeMsg && <span className="self-center text-sm text-muted-foreground">{completeMsg}</span>}
                </div>
              </header>

              {topic.explanation ? (
                <section className="rounded-xl border border-border bg-surface p-6">
                  <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold">
                    <BookOpen className="h-5 w-5 text-primary" /> Explanation
                  </h2>
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {topic.explanation}
                  </div>
                </section>
              ) : null}

              {topic.complexities?.length ? (
                <section>
                  <h2 className="mb-3 font-display text-xl font-semibold">Complexity</h2>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-background/80 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Operation</th>
                          <th className="px-4 py-3 text-left">Time</th>
                          <th className="px-4 py-3 text-left">Space</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topic.complexities.map((c) => (
                          <tr key={c.operationName} className="border-t border-border bg-surface/50">
                            <td className="px-4 py-3 font-medium">{c.operationName}</td>
                            <td className="px-4 py-3 font-mono text-primary">{c.timeComplexity}</td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">{c.spaceComplexity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {topic.codeImplementations?.length ? (
                <section className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Code</h2>
                  {topic.codeImplementations.map((impl) => (
                    <div key={`${impl.language}-${impl.code.slice(0, 20)}`} className="overflow-hidden rounded-xl border border-border bg-background">
                      <div className="border-b border-border px-4 py-2 font-mono text-xs text-primary">{impl.language}</div>
                      <pre className="max-h-[480px] overflow-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                        <code>{impl.code}</code>
                      </pre>
                    </div>
                  ))}
                </section>
              ) : null}
            </motion.article>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
