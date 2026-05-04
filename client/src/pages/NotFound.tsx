import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, SearchX } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="container flex-center" style={{ minHeight: '70vh', flexDirection: 'column', textAlign: 'center', gap: '1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <SearchX size={42} color="var(--primary-color)" />
        </div>

        <h1 className="heading-xl" style={{ marginBottom: '0.5rem' }}>
          4<span className="text-gradient">0</span>4
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '440px', marginBottom: '2rem' }}>
          Looks like this page got lost in a binary tree. Let's get you back on track.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <Home size={18} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
