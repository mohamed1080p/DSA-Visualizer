import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, BookOpen } from 'lucide-react';
import api from '../api/axios';

interface Problem {
  id: number;
  title: string;
  difficulty: string;
  topicName: string;
  slug: string;
}

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const;

const Problems = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('All');

  useEffect(() => {
    document.title = 'Problems — DSA Visualizer';
  }, []);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await api.get('/problems');
        setProblems(response.data);
      } catch (error) {
        console.error('Failed to fetch problems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  };

  const filteredProblems = problems.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.topicName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty =
      activeDifficulty === 'All' || p.difficulty.toLowerCase() === activeDifficulty.toLowerCase();
    return matchesSearch && matchesDifficulty;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  // Difficulty counts
  const counts = {
    All: problems.length,
    Easy: problems.filter(p => p.difficulty.toLowerCase() === 'easy').length,
    Medium: problems.filter(p => p.difficulty.toLowerCase() === 'medium').length,
    Hard: problems.filter(p => p.difficulty.toLowerCase() === 'hard').length,
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-lg" style={{ marginBottom: '0.75rem' }}>Problem Set</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Sharpen your skills by solving hand-picked algorithms and data structure problems.
        </p>
      </div>

      {/* Search + Filter Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            className="input-field" 
            style={{ paddingLeft: '3rem' }} 
            placeholder="Search problems by name or topic..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {DIFFICULTIES.map(diff => (
            <button
              key={diff}
              onClick={() => setActiveDifficulty(diff)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: activeDifficulty === diff
                  ? (diff === 'All' ? 'var(--primary-color)' : getDifficultyColor(diff))
                  : 'rgba(255,255,255,0.05)',
                color: activeDifficulty === diff ? 'white' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: activeDifficulty === diff
                  ? 'transparent'
                  : 'var(--surface-border)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {diff}
              <span style={{
                fontSize: '0.72rem',
                background: activeDifficulty === diff ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                padding: '1px 6px',
                borderRadius: '6px',
              }}>
                {counts[diff as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '200px' }}>
          <div className="text-gradient" style={{ fontWeight: 600 }}>Loading problems...</div>
        </div>
      ) : (
        <motion.div 
          className="glass-panel" 
          style={{ overflow: 'hidden' }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>TITLE</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>TOPIC</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>DIFFICULTY</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((problem) => (
                  <motion.tr 
                    key={problem.id} 
                    variants={itemVariants}
                    style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <Link to={`/problems/${problem.slug}`} style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={18} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                        {problem.title}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{problem.topicName}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '1rem',
                        background: `${getDifficultyColor(problem.difficulty)}20`,
                        color: getDifficultyColor(problem.difficulty),
                        border: `1px solid ${getDifficultyColor(problem.difficulty)}40`
                      }}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <Link to={`/problems/${problem.slug}`} style={{ color: 'var(--text-muted)' }}>
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProblems.length === 0 && (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No problems found matching your criteria.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Problems;
