import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Code2, Layers, Search, Sparkles, ArrowRight, Trophy, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

interface LearningPath {
  id: number; title: string; slug: string; description: string;
  icon: string; totalLevels: number; completedLevels: number; isStarted: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  code: <Code2 size={36} />, layers: <Layers size={36} />, search: <Search size={36} />,
};
const colorMap: Record<string, string> = {
  code: '#6366f1', layers: '#10b981', search: '#f59e0b',
};

const LearningPaths = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Learning Paths — DSA Visualizer'; }, []);
  useEffect(() => {
    api.get('/learningpaths').then(r => setPaths(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading paths...</div></div>;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: 900 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))', marginBottom: '1.25rem' }}>
          <Trophy size={36} className="text-gradient" style={{ color: 'var(--primary-color)' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
          Learning <span className="text-gradient">Paths</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto' }}>
          Follow structured paths to master DSA topics step by step.
        </p>
      </motion.div>

      {/* Path Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {paths.map((path, i) => {
          const accent = colorMap[path.icon] || '#6366f1';
          const pct = path.totalLevels > 0 ? Math.round((path.completedLevels / path.totalLevels) * 100) : 0;
          return (
            <motion.div key={path.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <Link to={`/paths/${path.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="glass-panel" style={{
                  padding: '2rem 2.5rem', display: 'flex', alignItems: 'center', gap: '2rem',
                  cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', position: 'relative', overflow: 'hidden',
                  border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '1.5rem'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)'; e.currentTarget.style.boxShadow = `0 20px 40px -10px ${accent}40, inset 0 0 20px ${accent}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '200px', height: '200px', background: accent, opacity: 0.15, filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />

                  {/* Icon */}
                  <div style={{ padding: '1.25rem', background: `linear-gradient(135deg, ${accent}20, ${accent}05)`, borderRadius: '1.25rem', color: accent, flexShrink: 0, border: `1px solid ${accent}40`, boxShadow: `0 8px 20px ${accent}20` }}>
                    {iconMap[path.icon] || <Code2 size={40} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '-0.3px' }}>{path.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '0 0 1rem', lineHeight: 1.5 }}>{path.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>{path.totalLevels} Levels</span>
                      {path.isStarted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', maxWidth: 200, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${accent}, #ec4899)`, borderRadius: 4, transition: 'width 0.5s ease-out' }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', color: accent, fontWeight: 700 }}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ flexShrink: 0, marginLeft: '1rem' }}>
                    {path.isStarted && path.completedLevels >= path.totalLevels ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, fontSize: '1rem', background: 'rgba(16,185,129,0.1)', padding: '0.6rem 1.2rem', borderRadius: '2rem', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <CheckCircle2 size={20} /> Mastered
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: path.isStarted ? `${accent}15` : `linear-gradient(135deg, ${accent}, #ec4899)`, color: path.isStarted ? accent : 'white', borderRadius: '2rem', fontWeight: 700, fontSize: '0.95rem', border: path.isStarted ? `1px solid ${accent}40` : 'none', boxShadow: path.isStarted ? 'none' : `0 8px 20px ${accent}40` }}>
                        {path.isStarted ? 'Continue Path' : 'Start Journey'} <ArrowRight size={18} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {paths.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>No learning paths available yet.</p>
        </div>
      )}
    </div>
  );
};

export default LearningPaths;
