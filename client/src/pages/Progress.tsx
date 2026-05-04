import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, BookOpen, Layers, Zap, History, ExternalLink, Activity, Sparkles, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface SubmissionHistory {
  id: number; status: string; verdict: string; language: string;
  runtimeMs: number | null; memoryKb: number | null; submittedAt: string;
  problemSlug: string; problemTitle: string;
}
interface RecentSolve {
  problemTitle: string; problemSlug: string; difficulty: string; solvedAt: string;
}
interface UserProgress {
  totalProblemsSolved: number; totalTopicsCompleted: number;
  dataStructuresTopicsCompleted: number; algorithmsTopicsCompleted: number;
  easyProblemsSolved: number; mediumProblemsSolved: number; hardProblemsSolved: number;
  currentStreak: number; longestStreak: number;
  totalProblemsCount: number; totalTopicsCount: number;
  totalEasyProblems: number; totalMediumProblems: number; totalHardProblems: number;
  totalDataStructuresTopics: number; totalAlgorithmsTopics: number;
  recentSolves: RecentSolve[];
}

/* ── SVG Radial Ring ── */
const RadialRing = ({ solved, total, size = 140, stroke = 10, color, label, icon }: {
  solved: number; total: number; size?: number; stroke?: number;
  color: string; label: string; icon: React.ReactNode;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(solved / total, 1) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
            strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{solved}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ {total}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
        {icon}{label}
      </div>
    </div>
  );
};

/* ── Difficulty mini-bar ── */
const DiffBar = ({ label, solved, total, color, delay }: {
  label: string; solved: number; total: number; color: string; delay: number;
}) => {
  const pct = total > 0 ? Math.min((solved / total) * 100, 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
          {label}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <b style={{ color: 'var(--text-primary)' }}>{solved}</b> / {total}
        </span>
      </div>
      <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 5, boxShadow: `0 0 12px ${color}50` }}
        />
      </div>
    </div>
  );
};

const Progress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [history, setHistory] = useState<SubmissionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { document.title = 'Progress — DSA Visualizer'; }, []);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      try {
        const [p, h] = await Promise.all([api.get('/userprogress'), api.get('/submissions/history')]);
        setProgress(p.data); setHistory(h.data);
      } catch (e: any) {
        if (e?.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); setProgress(null); }
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading your dashboard...</div></div>;
  if (!progress) return <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}><h2 className="heading-lg">Please sign in to view your progress.</h2></div>;

  const iv = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
  const diffColor = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem', maxWidth: 1100 }}>
      {/* ─── HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 1.2rem', background: 'rgba(99,102,241,0.08)', borderRadius: '2rem', border: '1px solid rgba(99,102,241,0.15)', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="var(--primary-color)" />
          <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Dashboard</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
          Your <span className="text-gradient">Progress</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>Track your coding journey and see how far you've come.</p>
      </motion.div>

      {/* ─── TOP ROW: RINGS + STREAK ─── */}
      <motion.div variants={iv} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Main ring card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <RadialRing solved={progress.totalProblemsSolved} total={progress.totalProblemsCount} color="var(--primary-color)" label="Problems" icon={<Trophy size={15} />} />
          <RadialRing solved={progress.totalTopicsCompleted} total={progress.totalTopicsCount} color="var(--secondary-color)" label="Topics" icon={<BookOpen size={15} />} />
        </div>

        {/* Streak + stats card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.9rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))', borderRadius: '1rem', color: '#f59e0b' }}>
              <Flame size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>Current Streak</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                {progress.currentStreak} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>days</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[
              { icon: <Award size={16} />, label: 'Best Streak', val: `${progress.longestStreak}d`, bg: 'rgba(99,102,241,0.08)' },
              { icon: <TrendingUp size={16} />, label: 'Acceptance', val: progress.totalProblemsCount > 0 ? `${Math.round((progress.totalProblemsSolved / progress.totalProblemsCount) * 100)}%` : '0%', bg: 'rgba(16,185,129,0.08)' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '0.75rem', background: s.bg, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── MIDDLE ROW: DIFFICULTY + CATEGORY ─── */}
      <motion.div variants={iv} initial="hidden" animate="visible" transition={{ delay: 0.1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Difficulty breakdown */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
            <div style={{ padding: '0.4rem', background: 'rgba(99,102,241,0.1)', borderRadius: '0.4rem', color: 'var(--primary-color)' }}><Zap size={18} /></div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Difficulty Breakdown</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <DiffBar label="Easy" solved={progress.easyProblemsSolved} total={progress.totalEasyProblems} color={diffColor.Easy} delay={0.2} />
            <DiffBar label="Medium" solved={progress.mediumProblemsSolved} total={progress.totalMediumProblems} color={diffColor.Medium} delay={0.4} />
            <DiffBar label="Hard" solved={progress.hardProblemsSolved} total={progress.totalHardProblems} color={diffColor.Hard} delay={0.6} />
          </div>
        </div>

        {/* Category mastery */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
            <div style={{ padding: '0.4rem', background: 'rgba(236,72,153,0.1)', borderRadius: '0.4rem', color: 'var(--secondary-color)' }}><Layers size={18} /></div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Category Mastery</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Data Structures', solved: progress.dataStructuresTopicsCompleted, total: progress.totalDataStructuresTopics, color: 'var(--primary-color)', icon: <BookOpen size={22} /> },
              { label: 'Algorithms', solved: progress.algorithmsTopicsCompleted, total: progress.totalAlgorithmsTopics, color: 'var(--secondary-color)', icon: <Target size={22} /> },
            ].map((cat, i) => (
              <motion.div key={i} whileHover={{ scale: 1.03 }} style={{
                padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem',
                border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', cursor: 'default'
              }}>
                <div style={{ color: cat.color, marginBottom: '0.75rem' }}>{cat.icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{cat.solved}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{cat.total}</span></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{cat.label}</div>
              </motion.div>
            ))}
          </div>
          {/* Recent solves */}
          {progress.recentSolves && progress.recentSolves.length > 0 && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent Solves</div>
              {progress.recentSolves.slice(0, 3).map((s, i) => (
                <Link key={i} to={`/problems/${s.problemSlug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={14} color={diffColor[s.difficulty as keyof typeof diffColor] || '#10b981'} />
                  <span style={{ flex: 1 }}>{s.problemTitle}</span>
                  <span style={{ fontSize: '0.7rem', color: diffColor[s.difficulty as keyof typeof diffColor] || '#10b981' }}>{s.difficulty}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── HEATMAP ─── */}
      <motion.div variants={iv} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        <ActivityHeatmap history={history} />
      </motion.div>

      {/* ─── HISTORY ─── */}
      <motion.div variants={iv} initial="hidden" animate="visible" transition={{ delay: 0.3 }} style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <History size={20} color="var(--primary-color)" /> Recent Activity
          </h2>
          <button onClick={() => setShowHistory(!showHistory)} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '2rem' }}>
            {showHistory ? 'Hide' : 'View History'}
          </button>
        </div>
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--surface-border)' }}>
                      {['PROBLEM', 'VERDICT', 'LANGUAGE', 'TIME', 'DATE'].map(h => (
                        <th key={h} style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, ...(h === 'DATE' ? { textAlign: 'right' as const } : {}) }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(sub => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <Link to={`/problems/${sub.problemSlug}`} style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.9rem' }}>
                            {sub.problemTitle}<ExternalLink size={12} style={{ opacity: 0.4 }} />
                          </Link>
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <span style={{ background: sub.verdict === 'Accepted' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: sub.verdict === 'Accepted' ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>{sub.verdict}</span>
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sub.language}</td>
                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sub.runtimeMs ? `${sub.runtimeMs}ms` : '-'}</td>
                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>{new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Activity size={40} style={{ opacity: 0.15, marginBottom: '0.75rem' }} />
                    <p>No submissions yet. <Link to="/problems" style={{ color: 'var(--primary-color)' }}>Start solving!</Link></p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

/* ══════════════════ HEATMAP ══════════════════ */
const ActivityHeatmap = ({ history }: { history: SubmissionHistory[] }) => {
  const days = 365;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startDate = new Date(today); startDate.setDate(today.getDate() - days + 1);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const counts: Record<string, number> = {};
  let maxCount = 0;
  history.forEach(s => { 
    const d = new Date(s.submittedAt).toISOString().split('T')[0]; 
    counts[d] = (counts[d] || 0) + 1; 
    if (counts[d] > maxCount) maxCount = counts[d];
  });

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  const weeks: { date: string; count: number; lvl: number; isToday: boolean; month: number }[][] = [];
  const cur = new Date(startDate);
  const todayStr = today.toISOString().split('T')[0];
  
  for (let w = 0; w < 53; w++) {
    const wk: typeof weeks[0] = [];
    for (let d = 0; d < 7; d++) {
      if (cur > today) break;
      const ds = cur.toISOString().split('T')[0];
      const c = counts[ds] || 0;
      wk.push({ date: ds, count: c, lvl: getLevel(c), isToday: ds === todayStr, month: cur.getMonth() });
      cur.setDate(cur.getDate() + 1);
    }
    if (wk.length) weeks.push(wk);
  }

  const colors = [
    'rgba(255,255,255,0.03)', // 0: Empty (very subtle)
    'rgba(16, 185, 129, 0.4)', // 1: Light green
    'rgba(16, 185, 129, 0.7)', // 2: Medium green
    'rgba(16, 185, 129, 1)',   // 3: Solid green
    '#34d399'                  // 4: Bright vibrant green
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, letterSpacing: '-0.3px' }}>
          <Activity size={20} color="#10b981" /> Contribution Graph
        </h3>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)' }}>
          Last 365 days
        </div>
      </div>
      
      <div style={{ overflowX: 'auto', paddingBottom: '1rem', position: 'relative', zIndex: 1 }} className="custom-scrollbar">
        {/* Month labels */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem', marginLeft: '24px' }}>
          {weeks.map((wk, wi) => {
            const isFirstWeekOfMonth = wk[0]?.date.endsWith('-01') || (wk[0]?.date.split('-')[2] <= '07' && wi > 0 && wk[0].month !== weeks[wi-1][0].month);
            return (
              <div key={wi} style={{ width: 14, flexShrink: 0, position: 'relative' }}>
                {isFirstWeekOfMonth && (
                  <span style={{ position: 'absolute', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, left: 0 }}>
                    {months[wk[0].month]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* Day of week labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '0.5rem', marginTop: '0.2rem' }}>
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => (
              <div key={i} style={{ height: 14, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: '14px', textAlign: 'right', width: '20px' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'inline-flex', gap: '4px' }}>
            {weeks.map((wk, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {wk.map((d, di) => (
                  <div key={di} title={`${d.count} submissions on ${d.date}`} style={{
                    width: 14, height: 14, borderRadius: 4, background: colors[d.lvl], cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: d.isToday ? '2px solid rgba(255,255,255,0.8)' : `1px solid ${d.lvl > 0 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.02)'}`,
                    boxShadow: d.lvl >= 3 ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                    animation: `heatmap-fade-in 0.5s ease-out forwards`,
                    animationDelay: `${(wi * 0.01) + (di * 0.01)}s`,
                    opacity: 0
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.5)'; e.currentTarget.style.zIndex = '10'; e.currentTarget.style.boxShadow = '0 0 12px rgba(16,185,129,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1'; e.currentTarget.style.boxShadow = d.lvl >= 3 ? '0 0 10px rgba(16,185,129,0.3)' : 'none'; }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
        <span style={{ fontWeight: 500 }}>Less</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {colors.map((c, i) => (
            <div key={i} style={{ 
              width: 14, height: 14, borderRadius: 4, background: c, 
              border: `1px solid ${i > 0 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.02)'}` 
            }} />
          ))}
        </div>
        <span style={{ fontWeight: 500 }}>More</span>
      </div>

      <style>{`
        @keyframes heatmap-fade-in {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default Progress;
