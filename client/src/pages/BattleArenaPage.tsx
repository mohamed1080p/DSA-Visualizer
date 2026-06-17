import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Timer, Code2, Send, Loader2, CheckCircle2 } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { useSignalR } from '@/context/SignalRContext';
import { useAuth } from '@/context/use-auth';
import { cn } from '@/lib/utils';
import { ApiError, apiJson } from '@/lib/api-client';
import VictoryOverlay from '@/components/VictoryOverlay';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

// Reuse components from ProblemDetailPage or local equivalents
const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
] as const;

type BattleProblemView = {
  id: string;
  order: number;
  title: string;
  description: string;
  difficulty?: string;
  points?: number;
  isSolved?: boolean;
};

type BattleSubmissionResult = {
  isCorrect?: boolean;
  IsCorrect?: boolean;
  verdict?: string;
  Verdict?: string;
  runtimeMs?: number | null;
  RuntimeMs?: number | null;
  memoryKb?: number | null;
  MemoryKb?: number | null;
  passedTestCases?: number;
  PassedTestCases?: number;
  totalTestCases?: number;
  TotalTestCases?: number;
  playerSolvedCount?: number;
  PlayerSolvedCount?: number;
};

function normalizeBattleProblems(raw: unknown): BattleProblemView[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p: Record<string, unknown>, idx: number) => {
    const slug = (p.slug ?? p.Slug ?? '') as string;
    const problemId = p.problemId ?? p.ProblemId ?? idx;
    const id = slug || String(problemId);
    const order = Number(p.order ?? p.Order ?? idx + 1);
    return {
      id,
      order,
      title: String(p.title ?? p.Title ?? `Problem ${idx + 1}`),
      description: String(p.description ?? p.Description ?? ''),
      difficulty: (p.difficulty ?? p.Difficulty) as string | undefined,
      points: p.points as number | undefined,
      isSolved: p.isSolved as boolean | undefined,
    };
  });
}

function pickOpponent(
  battle: Record<string, unknown>,
  myUserId?: string,
  myDisplayName?: string,
): { displayName?: string; userId?: string } | undefined {
  const direct = battle.opponent as { displayName?: string; userId?: string } | undefined;
  if (direct?.userId || direct?.displayName) return direct;

  const parts = battle.participants as { userId: string; displayName: string }[] | undefined;
  if (!parts?.length) return undefined;

  if (myUserId) {
    const opp = parts.find((x) => x.userId !== myUserId);
    if (opp) return { userId: opp.userId, displayName: opp.displayName };
  }
  if (myDisplayName) {
    const opp = parts.find((x) => x.displayName !== myDisplayName);
    if (opp) return { userId: opp.userId, displayName: opp.displayName };
  }
  return { userId: parts[0].userId, displayName: parts[0].displayName };
}

export default function BattleArenaPage() {
  const { currentBattle, surrenderBattle, joinBattle, battleConnection, battleStateReady } = useSignalR();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState('python');
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<(BattleSubmissionResult & { error?: string }) | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins default
  const { battleResult, clearBattleResult } = useSignalR();

  // Determine outcome from battleResult
  const battleOutcome = useMemo<'win' | 'loss' | 'draw' | null>(() => {
    if (!battleResult) return null;
    const winnerId = battleResult.winnerUserId;
    let outcome: 'win' | 'loss' | 'draw' = 'draw';
    if (winnerId) {
      outcome = winnerId === user?.userId ? 'win' : 'loss';
    }
    
    trackEvent(AnalyticsEvents.BATTLE_COMPLETED, { 
      outcome,
      winnerId
    });
    
    return outcome;
  }, [battleResult, user?.userId]);

  useEffect(() => {
    if (!battleStateReady) return;
    if (!currentBattle && !battleResult) {
      navigate('/playground');
    } else if (currentBattle) {
      trackEvent(AnalyticsEvents.BATTLE_STARTED, { 
        battleId: (currentBattle as any).battleId ?? (currentBattle as any).id 
      });
    }
  }, [battleStateReady, currentBattle, battleResult, navigate]);

  useEffect(() => {
    setTimeLeft(currentBattle?.timeLimitSeconds ?? 600);
  }, [currentBattle]);

  useEffect(() => {
    if (!currentBattle || !battleConnection) return;
    const raw = currentBattle as Record<string, unknown>;
    const id = raw.battleId ?? raw.id;
    if (!id || battleConnection.state !== signalR.HubConnectionState.Connected) return;

    void joinBattle(String(id)).catch(() => {
      /* hub will reject if not a participant; avoid unhandled rejection noise */
    });
  }, [currentBattle, battleConnection, joinBattle]);

  useEffect(() => {
    if (!currentBattle) return;

    const intervalId = globalThis.setInterval(() => {
      setTimeLeft(previous => Math.max(previous - 1, 0));
    }, 1000);

    return () => globalThis.clearInterval(intervalId);
  }, [currentBattle]);

  if (!currentBattle && !battleOutcome) return null;

  // If battle is over but we have a result to show, render just the overlay
  if (!currentBattle && battleOutcome) {
    return (
      <VictoryOverlay
        outcome={battleOutcome}
        onClose={() => {
          clearBattleResult();
          navigate('/playground');
        }}
      />
    );
  }

  const rawBattle = currentBattle as Record<string, unknown>;
  const battleId = String(rawBattle.battleId ?? rawBattle.id ?? '');
  const problems = normalizeBattleProblems(rawBattle.problems ?? rawBattle.Problems ?? []);
  const opponent = pickOpponent(rawBattle, user?.userId, user?.displayName);

  const problem = problems[activeProblemIdx];
  const problemOrder = problem?.order ?? activeProblemIdx + 1;

  if (!problem) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          Loading battle data or no problems available...
        </div>
      </AppShell>
    );
  }

  const handleSubmit = async () => {
    if (!battleId || !problem) return;

    const code = codeByProblem[problem.id] || '';
    if (code.trim().length === 0) {
      setVerdict({ error: 'Write code before submitting.' });
      return;
    }

    setSubmitting(true);
    setVerdict(null);
    try {
      const result = await apiJson<BattleSubmissionResult>(`/api/Battle/${encodeURIComponent(battleId)}/submissions`, {
        method: 'POST',
        auth: true,
        json: { problemOrder, code, language },
      });
      setVerdict(result);
      trackEvent(AnalyticsEvents.BATTLE_SUBMISSION, { 
        battleId, 
        isCorrect: result.isCorrect ?? result.IsCorrect 
      });
    } catch (error) {
      setVerdict({ error: error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSurrender = async () => {
    if (!battleId) return;
    if (!confirm('Surrender and leave battle?')) return;

    try {
      await surrenderBattle(battleId);
      // Navigate to playground — the BattleFinished event will fire and
      // set battleResult so PlaygroundPage can show the defeat overlay.
      navigate('/playground');
    } catch (error) {
      setVerdict({ error: error instanceof Error ? error.message : 'Surrender failed' });
    }
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          {/* Battle Header */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-primary/20 bg-surface/50 p-4 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                  <Swords className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold">Battle Arena</div>
                  <div className="font-mono text-xs text-muted-foreground uppercase">{String(battleId).slice(0, 8)}</div>
                </div>
              </div>
              
              <div className="h-10 w-px bg-border" />
              
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-widest">You</div>
                  <div className="font-display font-bold text-primary">{user?.displayName}</div>
                </div>
                <div className="font-display text-2xl font-black italic text-muted-foreground/30">VS</div>
                <div className="text-center">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Opponent</div>
                  <div className="font-display font-bold text-destructive">{opponent?.displayName || 'Unknown'}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 items-center gap-2 rounded-xl bg-background/50 px-6 font-mono text-2xl font-bold border border-border">
                <Timer className="h-5 w-5 text-primary" />
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <button 
                onClick={() => { void handleSurrender(); }}
                className="h-12 rounded-xl border border-destructive/20 px-6 font-display text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
              >
                Surrender
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            {/* Sidebar: Problems & Progress */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 font-mono text-xs text-primary uppercase tracking-tighter">Problems to solve</div>
                <div className="space-y-2">
                  {problems.map((p, idx: number) => (
                    <button
                      key={p.id ? `${p.id}` : `problem-${idx}`}
                      onClick={() => setActiveProblemIdx(idx)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition-all",
                        activeProblemIdx === idx 
                          ? "border-primary bg-primary/5 shadow-glow-sm" 
                          : "border-border hover:border-primary/40 bg-background/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold">{idx + 1}. {p.title}</span>
                        {p.isSolved && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{p.difficulty} • {p.points || 100} pts</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 font-mono text-xs text-primary uppercase tracking-tighter">Live Feed</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-muted-foreground"><span className="text-foreground font-medium">{opponent?.displayName}</span> is coding...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Area: Editor */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-background/50 px-5 py-3">
                  <div className="flex items-center gap-2 font-display font-bold">
                    <Code2 className="h-5 w-5 text-primary" />
                    {problem.title}
                  </div>
                  <div className="flex gap-2">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.value}
                        onClick={() => setLanguage(l.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          language === l.value ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 rounded-xl bg-background/60 p-5 text-sm leading-relaxed border border-border/50">
                    <div className="mb-2 font-mono text-[10px] text-primary uppercase">Description</div>
                    {problem.description || 'No description loaded for this battle problem.'}
                  </div>

                  <textarea
                    value={codeByProblem[problem.id] || ''}
                    onChange={(e) => setCodeByProblem(prev => ({ ...prev, [problem.id]: e.target.value }))}
                    className="h-[500px] w-full rounded-xl border border-border bg-[#0d1117] p-6 font-mono text-sm leading-relaxed text-[#d4d4d4] outline-none focus:border-primary/50 transition-colors"
                    placeholder="// Write your solution here..."
                    spellCheck={false}
                  />

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <button
                         disabled={submitting}
                         className="flex h-12 items-center gap-2 rounded-xl border border-border px-6 text-sm font-bold text-muted-foreground hover:bg-background transition-colors"
                       >
                         Run Tests
                       </button>
                       <button
                         type="button"
                         onClick={() => void handleSubmit()}
                         disabled={submitting || (codeByProblem[problem.id] || '').trim().length === 0}
                         className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground hover:shadow-glow transition-all"
                       >
                         {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                         Submit Solution
                       </button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground font-mono">
                      UTF-8 • {language.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {verdict && (
                <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
                  {verdict.error ? (
                    <div className="text-destructive">{verdict.error}</div>
                  ) : (
                    <>
                      <div className="font-display font-bold text-primary">
                        {verdict.IsCorrect ?? verdict.isCorrect ? 'Accepted' : 'Rejected'}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Score: {(verdict.PlayerSolvedCount ?? verdict.playerSolvedCount ?? 0)} solved
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Tests: {(verdict.PassedTestCases ?? verdict.passedTestCases ?? 0)} / {(verdict.TotalTestCases ?? verdict.totalTestCases ?? 0)}
                        {(verdict.Verdict ?? verdict.verdict) ? ` - ${verdict.Verdict ?? verdict.verdict}` : ''}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Victory / Defeat overlay */}
        {battleOutcome && (
          <VictoryOverlay
            outcome={battleOutcome}
            onClose={() => {
              clearBattleResult();
              navigate('/playground');
            }}
          />
        )}
      </PageTransition>
    </AppShell>
  );
}
