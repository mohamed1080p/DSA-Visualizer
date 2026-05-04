import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, BookOpen, Code2, Lock, CheckCircle2, Sparkles, PlayCircle, Star } from 'lucide-react';
import api from '../api/axios';

interface Level {
  id: number; title: string; order: number; type: string;
  slug: string | null; difficulty: string | null; isCompleted: boolean; isLocked: boolean;
}
interface PathDetail {
  id: number; title: string; slug: string; description: string;
  totalLevels: number; completedLevels: number; isStarted?: boolean; levels: Level[];
}

const diffColor: Record<string, string> = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };

// Sine wave offsets for a winding path
const getOffset = (index: number) => {
  const pattern = [0, 120, 180, 120, 0, -120, -180, -120];
  return pattern[index % pattern.length];
};

const LearningPathDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [path, setPath] = useState<PathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/learningpaths/${slug}`).then(r => { setPath(r.data); document.title = `${r.data.title} — DSA Visualizer`; })
      .catch(() => navigate('/paths')).finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleStart = async () => {
    if (!slug) return;
    setStarting(true);
    try {
      await api.post(`/learningpaths/${slug}/start`);
      const r = await api.get(`/learningpaths/${slug}`);
      setPath(r.data);
    } catch (e) { console.error(e); }
    setStarting(false);
  };

  if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading path...</div></div>;
  if (!path) return null;

  const pct = path.totalLevels > 0 ? Math.round((path.completedLevels / path.totalLevels) * 100) : 0;
  const isStarted = path.isStarted;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '8rem', maxWidth: 800, position: 'relative' }}>
      {/* Background Animated Orbs */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', background: 'var(--primary-color)', opacity: 0.12, filter: 'blur(100px)', borderRadius: '50%', animation: 'float1 20s infinite ease-in-out' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '350px', height: '350px', background: 'var(--secondary-color)', opacity: 0.12, filter: 'blur(100px)', borderRadius: '50%', animation: 'float2 25s infinite ease-in-out reverse' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: '#10b981', opacity: 0.05, filter: 'blur(150px)', borderRadius: '50%', animation: 'float3 30s infinite ease-in-out' }} />
      </div>

      {/* Back + Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/paths" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ChevronLeft size={18} /> Back to Paths
        </Link>

        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'var(--primary-color)', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }} />
          
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.5px' }}>{path.title}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '90%' }}>{path.description}</p>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={18} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{path.completedLevels} / {path.totalLevels}</span>
            </div>
            <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #ec4899)', borderRadius: 5, boxShadow: '0 0 10px rgba(236,72,153,0.5)' }} />
            </div>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>{pct}%</span>
          </div>
        </div>
      </motion.div>

      {/* Start button if not started */}
      {!isStarted && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <button onClick={handleStart} disabled={starting} className="btn" style={{ 
            padding: '1.2rem 3rem', fontSize: '1.15rem', borderRadius: '3rem', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            color: 'white', border: 'none', cursor: starting ? 'not-allowed' : 'pointer',
            boxShadow: '0 10px 25px -5px rgba(99,102,241,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => { if(!starting) e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { if(!starting) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <PlayCircle size={22} /> {starting ? 'Starting Journey...' : 'Start Your Journey'}
          </button>
        </motion.div>
      )}

      {/* Level Tree */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', padding: '2rem 0', gap: '2rem' }}>
        {path.levels.map((level, i) => {
          const isActive = isStarted && !level.isCompleted && !level.isLocked;
          const accent = level.type === 'problem' ? (diffColor[level.difficulty || ''] || '#6366f1') : 'var(--primary-color)';
          const currentX = getOffset(i);
          const nextX = i < path.levels.length - 1 ? getOffset(i + 1) : currentX;
          
          // Connectors
          const hasNext = i < path.levels.length - 1;
          // Node styling
          const nodeSize = isActive ? 80 : 70;
          
          return (
            <motion.div key={level.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', minHeight: '120px' }}
            >
              {/* Connector Curve to next node */}
              {hasNext && (
                <div style={{ position: 'absolute', top: `${nodeSize / 2}px`, left: 0, right: 0, height: `calc(100% + 2rem + ${nodeSize / 2}px)`, zIndex: -1, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
                  <svg width="400" height="100%" style={{ overflow: 'visible', position: 'relative', left: '-50px' }}>
                    <path 
                      d={`M ${200 + currentX} 0 C ${200 + currentX} 60, ${200 + nextX} calc(100% - 60px), ${200 + nextX} 100%`}
                      fill="none"
                      stroke={level.isCompleted ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={isActive || level.isCompleted ? 6 : 4}
                      strokeDasharray={level.isCompleted ? 'none' : '8 8'}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}

              {/* Node content */}
              <div style={{ transform: `translateX(${currentX}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                
                {/* Floating "Start Here" tooltip for active node */}
                {isActive && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
                    style={{ position: 'absolute', top: -35, background: 'var(--primary-color)', color: 'white', padding: '4px 12px', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(99,102,241,0.3)' }}>
                    START HERE
                    <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 8, height: 8, background: 'var(--primary-color)' }} />
                  </motion.div>
                )}

                {/* The Circle */}
                {level.isLocked ? (
                  <div style={{
                    width: nodeSize, height: nodeSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed',
                    backdropFilter: 'blur(10px)', transition: 'all 0.3s'
                  }}>
                    <Lock size={24} />
                  </div>
                ) : level.isCompleted ? (
                  <div style={{
                    width: nodeSize, height: nodeSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'radial-gradient(circle at center, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', 
                    border: '2px solid #10b981', color: '#10b981', cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(16,185,129,0.2), inset 0 0 10px rgba(16,185,129,0.1)',
                    backdropFilter: 'blur(10px)', transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                    onClick={() => level.slug && navigate(level.type === 'problem' ? `/problems/${level.slug}` : `/topics/${level.slug}`)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(16,185,129,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(16,185,129,0.2), inset 0 0 10px rgba(16,185,129,0.1)'; }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                ) : (
                  <div style={{
                    width: nodeSize, height: nodeSize, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `radial-gradient(circle at center, ${accent}25, ${accent}10)`, 
                    border: isActive ? `3px solid ${accent}` : `2px dashed ${accent}`, color: accent, cursor: 'pointer',
                    boxShadow: isActive ? `0 0 30px ${accent}40, inset 0 0 15px ${accent}20` : 'none', 
                    animation: isActive ? 'pulse-node 2s infinite' : 'none',
                    backdropFilter: 'blur(10px)', transition: 'transform 0.2s'
                  }}
                    onClick={() => {
                      if (level.slug) {
                        navigate(level.type === 'problem' ? `/problems/${level.slug}?fromPath=${slug}` : `/topics/${level.slug}?fromPath=${slug}`);
                      }
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {level.type === 'problem' ? <Code2 size={28} /> : <BookOpen size={28} />}
                  </div>
                )}

                {/* Label Box */}
                <div style={{ 
                  marginTop: '1rem', 
                  background: 'rgba(0,0,0,0.5)', 
                  padding: '0.6rem 1.25rem', 
                  borderRadius: '1.5rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center',
                  minWidth: 150,
                  maxWidth: 200,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: level.isLocked ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.2 }}>
                    {level.title}
                  </div>
                  {level.difficulty && !level.isLocked && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: diffColor[level.difficulty] || 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: diffColor[level.difficulty] || 'var(--text-muted)', boxShadow: `0 0 5px ${diffColor[level.difficulty] || 'var(--text-muted)'}` }} />
                      {level.difficulty}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Completion message */}
        {pct === 100 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}
            style={{ marginTop: '4rem', textAlign: 'center', padding: '3rem', background: 'radial-gradient(circle at center, rgba(16,185,129,0.15), rgba(0,0,0,0.2))', borderRadius: '1.5rem', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 40px rgba(16,185,129,0.2)', position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 500 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'2\' fill=\'%2310b981\' fill-opacity=\'0.2\'/%3E%3C/svg%3E")', opacity: 0.5 }} />
            <Sparkles size={48} color="#10b981" style={{ marginBottom: '1rem', position: 'relative' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: '#10b981', margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 800, position: 'relative' }}>Path Mastered!</h3>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: 0, position: 'relative', opacity: 0.9 }}>Incredible job. You've completed all levels in this path and proven your mastery.</p>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes pulse-node {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.4), inset 0 0 15px rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.5); }
          50% { box-shadow: 0 0 40px rgba(99,102,241,0.8), inset 0 0 25px rgba(99,102,241,0.5); border-color: rgba(99,102,241,1); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.15); }
          66% { transform: translate(20px, -20px) scale(0.85); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -40%) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default LearningPathDetail;
