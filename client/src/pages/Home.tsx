import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Code, BrainCircuit, Trophy, Terminal, Zap, Users, BookOpen, Bot } from 'lucide-react';

/* Animated counter hook */
const useCounter = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
};

const Home = () => {
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    document.title = 'DSA Visualizer — Master Algorithms & Data Structures';
  }, []);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
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
    },
    {
      icon: <Bot size={32} color="#a855f7" />,
      title: 'AI Tutor',
      description: 'Get instant help from our AI-powered chatbot. Ask about algorithms, complexity, or interview strategies and receive clear, practical answers.'
    }
  ];

  const stats = [
    { label: 'Topics', value: 15, icon: <BookOpen size={20} /> },
    { label: 'Problems', value: 30, icon: <Code size={20} /> },
    { label: 'Visualizations', value: 10, icon: <BrainCircuit size={20} /> },
    { label: 'Languages', value: 4, icon: <Users size={20} /> },
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
          <Link
            to={isLoggedIn ? '/problems' : '/auth'}
            className="btn btn-primary"
            style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}
          >
            <Code size={20} />
            {isLoggedIn ? 'Solve Problems' : 'Start Coding Now'}
          </Link>
          <Link to="/topics" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Explore Topics
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Banner */}
      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '5rem',
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={containerVariants}
      >
        {stats.map((stat) => {
          const { count, ref } = useCounter(stat.value);
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              ref={ref}
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {count}+
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        id="features"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '1.5rem',
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
              width: '56px', height: '56px', 
              borderRadius: '0.75rem', 
              background: 'rgba(255,255,255,0.03)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--surface-border)'
            }}>
              {feature.icon}
            </div>
            <h3 className="heading-lg" style={{ fontSize: '1.3rem', marginTop: '0.25rem' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel"
        style={{
          padding: '3rem',
          textAlign: 'center',
          marginBottom: '4rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
        <h2 className="heading-lg" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
          Ready to level up your <span className="text-gradient">DSA skills</span>?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
          Join hundreds of students mastering algorithms with interactive visualizations and hands-on practice.
        </p>
        <Link to={isLoggedIn ? '/topics' : '/auth'} className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
          {isLoggedIn ? 'Continue Learning' : 'Get Started Free'}
        </Link>
      </motion.div>
    </div>
  );
};

export default Home;
