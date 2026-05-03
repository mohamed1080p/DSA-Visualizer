import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axios';

interface Topic {
  id: number;
  title: string;
  description: string;
  slug: string;
  difficulty: string;
  categoryName: string;
}

const Topics = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await api.get('/topics');
        setTopics(response.data);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const categories = ['All', ...new Set(topics.map(t => t.categoryName))];

  const filteredTopics = topics.filter(t => {
    if (t.title === 'Singly Linked List') return false;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || t.categoryName === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>Learning Paths</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Master Data Structures and Algorithms with our curated collection of topics.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            style={{ paddingLeft: '3rem' }} 
            placeholder="Search topics..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ 
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: activeCategory === cat ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: activeCategory === cat ? 'var(--primary-color)' : 'var(--surface-border)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}>
          <div className="text-gradient">Loading topics...</div>
        </div>
      ) : (
        <motion.div 
          className="grid-layout"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
            gap: '1.5rem' 
          }}
        >
          {filteredTopics.map((topic) => (
            <motion.div key={topic.id} variants={itemVariants}>
              <Link to={`/topics/${topic.slug}`} className="glass-panel" style={{ 
                padding: '2rem 1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                height: '180px',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid var(--surface-border)',
                borderRadius: '1.5rem',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--surface-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '0.025em'
                }}>
                  {topic.title}
                </h3>
                
                <div style={{ 
                  marginTop: '1rem',
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  border: '1px solid var(--surface-border)'
                }}>
                  {topic.categoryName}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && filteredTopics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
          No topics found in this category.
        </div>
      )}
    </div>
  );
};

export default Topics;
