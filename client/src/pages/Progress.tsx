import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, BookOpen, Layers, Zap, History, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface SubmissionHistory {
  id: number;
  status: string;
  verdict: string;
  language: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  submittedAt: string;
  problemSlug: string;
  problemTitle: string;
}

interface UserProgress {
  totalProblemsSolved: number;
  totalTopicsCompleted: number;
  dataStructuresTopicsCompleted: number;
  algorithmsTopicsCompleted: number;
  easyProblemsSolved: number;
  mediumProblemsSolved: number;
  hardProblemsSolved: number;
  currentStreak: number;
  longestStreak: number;
}

const Progress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [history, setHistory] = useState<SubmissionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await api.get('/userprogress');
        setProgress(response.data);
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const fetchHistory = async () => {
    if (history.length > 0) {
      setShowHistory(!showHistory);
      return;
    }

    setLoadingHistory(true);
    try {
      const response = await api.get('/submissions/history');
      setHistory(response.data);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="text-gradient">Analyzing your achievements...</div></div>;
  if (!progress) return <div className="container">Please sign in to view your progress.</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>Your Progress</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your journey and see how far you've come.</p>
      </div>

      <motion.div 
        className="grid-layout" 
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Main Stats */}
        <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', borderRadius: '1rem' }}>
            <Trophy size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Problems Solved</div>
            <div className="heading-lg" style={{ fontSize: '2rem' }}>{progress.totalProblemsSolved}</div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', color: 'var(--secondary-color)', borderRadius: '1rem' }}>
            <Flame size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Streak</div>
            <div className="heading-lg" style={{ fontSize: '2rem' }}>{progress.currentStreak} Days</div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '1rem' }}>
            <Target size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Topics Completed</div>
            <div className="heading-lg" style={{ fontSize: '2rem' }}>{progress.totalTopicsCompleted}</div>
          </div>
        </motion.div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Difficulty Breakdown */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 className="heading-lg" style={{ fontSize: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={20} color="var(--primary-color)" />
            Difficulty Breakdown
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600, color: '#10b981' }}>Easy</span>
                <span style={{ color: 'var(--text-secondary)' }}>{progress.easyProblemsSolved} Solved</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (progress.easyProblemsSolved / 20) * 100)}%` }} 
                  style={{ height: '100%', background: '#10b981', borderRadius: '4px' }} 
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>Medium</span>
                <span style={{ color: 'var(--text-secondary)' }}>{progress.mediumProblemsSolved} Solved</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (progress.mediumProblemsSolved / 15) * 100)}%` }} 
                  style={{ height: '100%', background: '#f59e0b', borderRadius: '4px' }} 
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>Hard</span>
                <span style={{ color: 'var(--text-secondary)' }}>{progress.hardProblemsSolved} Solved</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (progress.hardProblemsSolved / 10) * 100)}%` }} 
                  style={{ height: '100%', background: '#ef4444', borderRadius: '4px' }} 
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories Progress */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 className="heading-lg" style={{ fontSize: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Layers size={20} color="var(--secondary-color)" />
            Category Mastery
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
              <BookOpen size={24} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Data Structures</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{progress.dataStructuresTopicsCompleted}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topics Mastery</div>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
              <Target size={24} color="var(--secondary-color)" style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Algorithms</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{progress.algorithmsTopicsCompleted}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topics Mastery</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.1)', textAlign: 'center' }}>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Your longest streak is <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{progress.longestStreak} days</span>. Keep going!
             </p>
          </div>
        </motion.div>
      </div>

      {/* Submission History Section */}
      <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="heading-lg" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History size={24} color="var(--primary-color)" />
            Recent Activity
          </h2>
          <button 
            onClick={fetchHistory} 
            disabled={loadingHistory}
            className="btn btn-secondary" 
            style={{ padding: '0.6rem 1.5rem' }}
          >
            {loadingHistory ? 'Loading...' : (showHistory ? 'Hide History' : 'View Full History')}
          </button>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>PROBLEM</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>VERDICT</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>LANGUAGE</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>TIME</th>
                      <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'right' }}>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <Link to={`/problems/${sub.problemSlug}`} style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {sub.problemTitle}
                            <ExternalLink size={14} style={{ opacity: 0.5 }} />
                          </Link>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ 
                            color: sub.verdict === 'Accepted' ? '#10b981' : '#ef4444', 
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}>
                            {sub.verdict}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{sub.language}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{sub.runtimeMs ? `${sub.runtimeMs}ms` : '-'}</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'right' }}>
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No submissions found yet. Start solving problems!
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Progress;
