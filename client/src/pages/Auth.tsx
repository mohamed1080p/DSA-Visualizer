import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AtSign, ArrowRight, Eye, EyeOff, Code2, BrainCircuit, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../components/Toast';

const Auth = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = isLogin ? 'Sign In — DSA Visualizer' : 'Create Account — DSA Visualizer';
  }, [isLogin]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data));
      } else {
        const response = await api.post('/auth/register', { 
          email, 
          password, 
          username, 
          displayName 
        });
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      showToast(isLogin ? 'Welcome back!' : 'Account created successfully!', 'success');
      window.dispatchEvent(new Event('auth-change'));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalLogin = (provider: string) => {
    window.location.href = `http://localhost:5258/api/auth/external-login?provider=${provider}`;
  };

  const formVariants = {
    hidden: { opacity: 0, x: isLogin ? -20 : 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: isLogin ? 20 : -20, transition: { duration: 0.3 } }
  };

  const features = [
    { icon: <BrainCircuit size={20} />, text: 'Interactive algorithm visualizations' },
    { icon: <Code2 size={20} />, text: 'Code execution with test cases' },
    { icon: <Trophy size={20} />, text: 'Track your learning progress' },
    { icon: <Zap size={20} />, text: 'AI-powered tutor assistance' },
  ];

  return (
    <div className="container flex-center" style={{ minHeight: '85vh', padding: '2rem 1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        width: '100%',
        maxWidth: '900px',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        border: '1px solid var(--surface-border)',
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
      }}>
        {/* Left — Form Panel */}
        <div style={{ padding: '2.5rem 2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="heading-lg" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {isLogin ? 'Please enter login details below' : 'Start your journey to mastering algorithms'}
            </p>
            {error && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: 'var(--radius-md)',
                color: '#ef4444',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'register'}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
            >
              {!isLogin && (
                <>
                  <div>
                    <label className="input-label">Display Name</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ paddingLeft: '2.75rem' }} 
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Username</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <AtSign size={18} />
                      </div>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ paddingLeft: '2.75rem' }} 
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="input-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    className="input-field" 
                    style={{ paddingLeft: '2.75rem' }} 
                    placeholder="Enter the email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="input-field" 
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }} 
                    placeholder="Enter the Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }} disabled={isLoading}>
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                <ArrowRight size={18} />
              </button>
            </motion.form>
          </AnimatePresence>

          {isLogin && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Or continue</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleExternalLogin('Google')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button 
                  type="button" 
                  onClick={() => handleExternalLogin('GitHub')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(null); setShowPassword(false); }} 
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.875rem' }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        {/* Right — Illustration/Info Panel */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.12))',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderLeft: '1px solid var(--surface-border)',
        }}>
          {/* DSA-themed illustration */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '160px',
              height: '160px',
              margin: '0 auto',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '2px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Central tree visualization */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                {/* Edges */}
                <line x1="60" y1="25" x2="35" y2="55" stroke="rgba(99,102,241,0.5)" strokeWidth="2" />
                <line x1="60" y1="25" x2="85" y2="55" stroke="rgba(99,102,241,0.5)" strokeWidth="2" />
                <line x1="35" y1="55" x2="20" y2="85" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
                <line x1="35" y1="55" x2="50" y2="85" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
                <line x1="85" y1="55" x2="70" y2="85" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
                <line x1="85" y1="55" x2="100" y2="85" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
                {/* Root node */}
                <circle cx="60" cy="25" r="12" fill="rgba(99,102,241,0.9)" />
                <text x="60" y="29" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">8</text>
                {/* Level 1 nodes */}
                <circle cx="35" cy="55" r="11" fill="rgba(168,85,247,0.8)" />
                <text x="35" y="59" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">3</text>
                <circle cx="85" cy="55" r="11" fill="rgba(168,85,247,0.8)" />
                <text x="85" y="59" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">10</text>
                {/* Level 2 nodes */}
                <circle cx="20" cy="85" r="9" fill="rgba(16,185,129,0.7)" />
                <text x="20" y="89" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">1</text>
                <circle cx="50" cy="85" r="9" fill="rgba(16,185,129,0.7)" />
                <text x="50" y="89" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">6</text>
                <circle cx="70" cy="85" r="9" fill="rgba(16,185,129,0.7)" />
                <text x="70" y="89" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">9</text>
                <circle cx="100" cy="85" r="9" fill="rgba(16,185,129,0.7)" />
                <text x="100" y="89" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">14</text>
              </svg>
            </div>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
            Master algorithms <span className="text-gradient">visually</span>
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '2rem' }}>
            Build deep understanding of data structures with interactive step-by-step visualizations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ color: 'var(--primary-color)', flexShrink: 0 }}>{f.icon}</span>
                {f.text}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile responsive override */}
      <style>{`
        @media (max-width: 768px) {
          .container > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          .container > div[style*="grid-template-columns"] > div:last-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Auth;
