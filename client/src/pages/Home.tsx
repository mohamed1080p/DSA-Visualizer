import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Code, BrainCircuit, Trophy, Terminal, Zap } from 'lucide-react';

const Home = () => {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const features = [
    {
      icon: <BrainCircuit size={32} color="var(--primary-color)" />,
      title: 'Master Algorithms',
      description: 'Interactive visualizations help you build a deep, intuitive understanding of complex data structures and algorithms, essential for technical interviews.'
    },
    {
      icon: <Terminal size={32} color="var(--secondary-color)" />,
      title: 'Real-time Execution',
      description: 'Write code in our advanced editor and run it against comprehensive test cases securely in the cloud with immediate feedback.'
    },
    {
      icon: <Trophy size={32} color="#10b981" />,
      title: 'Track Progress',
      description: 'Watch your skills grow as you conquer topics. Our dashboard provides detailed analytics on your problem-solving journey.'
    }
  ];

  return (
    <div className="container">
      {/* Hero Section */}
      <motion.div 
        className="flex-center" 
        style={{ flexDirection: 'column', textAlign: 'center', margin: '4rem 0', gap: '1.5rem' }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 1rem', 
          background: 'rgba(99, 102, 241, 0.1)', 
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '2rem',
          color: 'var(--primary-color)',
          fontWeight: 500,
          marginBottom: '1rem'
        }}>
          <Zap size={16} fill="currentColor" />
          <span>The Ultimate Platform for CS Students</span>
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="heading-xl">
          Visualize. Code. <span className="text-gradient">Conquer.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} style={{ maxWidth: '700px', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          Elevate your software engineering career. DSA Visualizer bridges the gap between theoretical computer science and practical coding skills.
        </motion.p>
        
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/auth" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            <Code size={20} />
            Start Coding Now
          </Link>
          <a href="#features" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Explore Features
          </a>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        id="features"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginTop: '6rem',
          marginBottom: '4rem'
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={itemVariants} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              width: '64px', height: '64px', 
              borderRadius: '1rem', 
              background: 'rgba(255,255,255,0.03)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--surface-border)'
            }}>
              {feature.icon}
            </div>
            <h3 className="heading-lg" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Home;
