import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Code2, Loader2, Play, Send, Terminal, XCircle } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { ApiError, apiJson } from '@/lib/api-client';
import { useAuth } from '@/context/use-auth';
import { cn } from '@/lib/utils';

type ProblemDetail = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  topicName: string;
  slug: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  sampleTestCases: { id: number; input: string; expectedOutput: string }[];
};

type SubmissionQueued = {
  submissionId: number;
  status: string;
  pollUrl: string;
};

type SubmissionResult = {
  id: number;
  status: string;
  verdict: string;
  failureReason?: string;
  language: string;
  runtimeMs?: number | null;
  memoryKb?: number | null;
  submittedAt: string;
  testResults: { verdict: string; actualOutput?: string | null; expectedOutput: string; input: string; runtimeMs?: number | null }[];
};

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
] as const;

const TEMPLATES: Record<string, string> = {
  python: `# Read input from stdin and print the answer.
def solve():
    data = input().strip()
    print(data)

if __name__ == "__main__":
    solve()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string input;
    getline(cin, input);
    cout << input << "\\n";
    return 0;
}
`,
  java: `import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        System.out.println(input == null ? "" : input);
    }
}
`,
  csharp: `using System;

public class Program
{
    public static void Main()
    {
        var input = Console.ReadLine();
        Console.WriteLine(input ?? string.Empty);
    }
}
`,
};

const LEVEL_COLOR: Record<string, string> = {
  Easy: 'bg-success/15 text-success border-success/30',
  Medium: 'bg-warning/15 text-warning border-warning/30',
  Hard: 'bg-destructive/15 text-destructive border-destructive/30',
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isFinalStatus(status: string) {
  return status === 'Completed' || status === 'Failed';
}

function verdictClass(verdict: string) {
  if (verdict === 'Accepted') return 'border-success/30 bg-success/15 text-success';
  if (!verdict) return 'border-border bg-background text-muted-foreground';
  return 'border-destructive/30 bg-destructive/15 text-destructive';
}

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]['value']>('python');
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>(TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const code = codeByLang[language] ?? '';

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await apiJson<ProblemDetail>(`/api/Problems/${encodeURIComponent(slug)}`);
      setProblem(detail);
    } catch (e) {
      setProblem(null);
      setError(e instanceof ApiError ? e.message : 'Could not load problem.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function submit() {
    if (!slug || !isAuthenticated) return;
    setSubmitting(true);
    setSubmitMsg(null);
    setError(null);
    setResult(null);
    try {
      const queued = await apiJson<SubmissionQueued>(`/api/Submissions/${encodeURIComponent(slug)}`, {
        method: 'POST',
        auth: true,
        json: { code, language },
      });
      setSubmitMsg(`Submission #${queued.submissionId} queued.`);

      for (let i = 0; i < 12; i += 1) {
        await wait(i < 3 ? 900 : 1600);
        const next = await apiJson<SubmissionResult>(`/api/Submissions/${queued.submissionId}`, { auth: true });
        setResult(next);
        setSubmitMsg(`Submission #${queued.submissionId}: ${next.status}${next.verdict ? ` / ${next.verdict}` : ''}`);
        if (isFinalStatus(next.status)) break;
      }

    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <Link to="/problems" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> All problems
          </Link>

          {loading && (
            <div className="flex items-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading problem...
            </div>
          )}
          {error && <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}

          {problem && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
              <div className="space-y-5">
                <section className="rounded-xl border border-border bg-surface p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">{problem.topicName}</span>
                    <span className={cn('rounded border px-2 py-0.5 font-mono text-xs uppercase', LEVEL_COLOR[problem.difficulty] ?? 'border-border bg-background')}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <h1 className="font-display text-4xl font-bold">{problem.title}</h1>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{problem.description}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Metric icon={Clock} label="Time" value={`${problem.timeLimitMs} ms`} />
                    <Metric icon={Terminal} label="Memory" value={`${Math.round(problem.memoryLimitKb / 1024)} MB`} />
                    <Metric icon={CheckCircle2} label="Samples" value={String(problem.sampleTestCases.length)} />
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-surface p-6">
                  <div className="mb-4 font-mono text-xs text-primary">SAMPLE_TESTS/</div>
                  <div className="space-y-3">
                    {problem.sampleTestCases.map((t, idx) => (
                      <div key={t.id} className="rounded-md border border-border bg-background p-4">
                        <div className="mb-2 font-mono text-xs text-muted-foreground">Sample {idx + 1}</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <pre className="overflow-auto rounded border border-border bg-surface p-3 font-mono text-xs text-muted-foreground">{t.input}</pre>
                          <pre className="overflow-auto rounded border border-border bg-surface p-3 font-mono text-xs text-primary">{t.expectedOutput}</pre>
                        </div>
                      </div>
                    ))}
                    {problem.sampleTestCases.length === 0 && <p className="text-sm text-muted-foreground">No public sample tests.</p>}
                  </div>
                </section>

              </div>

              <div className="space-y-5">
                <section className="overflow-hidden rounded-xl border border-border bg-surface">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                    <div className="flex items-center gap-2 font-display font-bold">
                      <Code2 className="h-5 w-5 text-primary" /> Solution
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => setLanguage(l.value)}
                          className={cn(
                            'h-9 rounded-md border px-3 text-sm font-medium transition-colors',
                            language === l.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CodeEditor
                    language={language}
                    value={code}
                    onChange={(next) => setCodeByLang((prev) => ({ ...prev, [language]: next }))}
                  />
                  <div className="flex flex-wrap items-center gap-3 border-t border-border p-4">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        disabled={submitting || code.trim().length === 0}
                        onClick={() => void submit()}
                        className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-glow disabled:opacity-60"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Submit
                      </button>
                    ) : (
                      <Link to="/login" className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">
                        <Play className="h-4 w-4" /> Sign in to submit
                      </Link>
                    )}
                    {submitMsg && <span className="text-sm text-muted-foreground">{submitMsg}</span>}
                  </div>
                </section>

                {result && (
                  <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-surface p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="font-mono text-xs text-primary">RESULT/</div>
                      <span className={cn('rounded border px-2 py-1 font-mono text-[10px]', verdictClass(result.verdict))}>
                        {result.verdict || result.status}
                      </span>
                    </div>
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                      <Metric icon={Clock} label="Runtime" value={result.runtimeMs ? `${result.runtimeMs} ms` : '-'} />
                      <Metric icon={Terminal} label="Memory" value={result.memoryKb ? `${result.memoryKb} KB` : '-'} />
                      <Metric icon={result.verdict === 'Accepted' ? CheckCircle2 : XCircle} label="Status" value={result.verdict || result.status} />
                    </div>
                    {result.failureReason && (
                      <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs leading-relaxed text-destructive">
                        {result.failureReason}
                      </div>
                    )}
                    <div className="space-y-2">
                      {result.testResults.map((t, idx) => (
                        <div key={`${t.input}-${idx}`} className="rounded-md border border-border bg-background p-3 text-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono text-xs text-muted-foreground">Case {idx + 1}</span>
                            <span className={cn('rounded border px-2 py-0.5 font-mono text-[10px]', verdictClass(t.verdict))}>{t.verdict}</span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            <pre className="overflow-auto rounded bg-surface p-2 font-mono text-xs text-muted-foreground">{t.input}</pre>
                            <pre className="overflow-auto rounded bg-surface p-2 font-mono text-xs text-muted-foreground">{t.actualOutput ?? ''}</pre>
                            <pre className="overflow-auto rounded bg-surface p-2 font-mono text-xs text-primary">{t.expectedOutput}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <div className="font-mono text-sm text-foreground">{value}</div>
    </div>
  );
}

function CodeEditor({
  language,
  value,
  onChange,
}: {
  language: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const lines = value.split('\n');
  const ext = language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'cs';

  function updateCursor() {
    const pos = editorRef.current?.selectionStart ?? 0;
    const before = value.slice(0, pos).split('\n');
    setCursor({ line: before.length, col: (before[before.length - 1]?.length ?? 0) + 1 });
  }

  return (
    <div className="bg-[#0d1117]">
      <div className="flex h-9 items-center border-b border-[#30363d] bg-[#161b22] text-xs text-[#8b949e]">
        <div className="flex h-full items-center gap-2 border-r border-[#30363d] bg-[#0d1117] px-4 font-mono text-[#c9d1d9]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f85149]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d29922]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
          <span className="ml-2">solution.{ext}</span>
        </div>
      </div>
      <div className="relative min-h-[560px] overflow-hidden bg-[#0d1117]">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-14 overflow-hidden border-r border-[#21262d] bg-[#0d1117] pt-4 text-right font-mono text-[13px] leading-6 text-[#6e7681]">
          <div style={{ transform: `translateY(-${scrollTop}px)` }}>
            {lines.map((_, idx) => (
              <div key={idx} className="h-6 pr-3">
                {idx + 1}
              </div>
            ))}
          </div>
        </div>
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          onClick={updateCursor}
          onKeyUp={updateCursor}
          onSelect={updateCursor}
          spellCheck={false}
          className="block min-h-[560px] w-full resize-y border-0 bg-[#0d1117] py-4 pl-[4.5rem] pr-5 font-mono text-[15px] leading-6 text-[#d4d4d4] caret-[#58a6ff] outline-none selection:bg-[#264f78]"
        />
      </div>
      <div className="flex h-8 items-center justify-between border-t border-[#30363d] bg-[#1f6feb] px-3 font-mono text-xs text-white">
        <span>{language.toUpperCase()}</span>
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
      </div>
    </div>
  );
}
