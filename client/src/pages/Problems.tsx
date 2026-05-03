import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, BookOpen } from 'lucide-react';
import api from '../api/axios';

interface Problem {
  id: number;
  title: string;
  difficulty: string;
  topicName: string;
  slug: string;
}

const Problems = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.topicName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>Problem Set</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Sharpen your skills by solving hand-picked algorithms and data structure problems.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
        <button className="btn btn-secondary">
          <Filter size={18} />
          Filter
        </button>
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
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>TITLE</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>TOPIC</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>DIFFICULTY</th>
                  <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}></th>
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
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <Link to={`/problems/${problem.slug}`} style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={18} style={{ color: 'var(--primary-color)' }} />
                        {problem.title}
                      </Link>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{problem.topicName}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
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
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
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
