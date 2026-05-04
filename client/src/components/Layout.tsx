import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, User, LogIn, LogOut, Bot, MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import Chatbot from '../pages/Chatbot';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [showChatWidget, setShowChatWidget] = useState(false);

  const loadUser = useCallback(() => {
    const savedUser = localStorage.getItem('user');
    setUser(savedUser ? JSON.parse(savedUser) : null);
  }, []);

  useEffect(() => {
    loadUser();
    window.addEventListener('auth-change', loadUser);
    return () => window.removeEventListener('auth-change', loadUser);
  }, [loadUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast('Signed out successfully', 'info');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  // Hide floating chat button on the dedicated chatbot page
  const isChatbotPage = location.pathname === '/chatbot';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', borderRadius: '1rem', border: '1px solid var(--surface-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="flex-center" style={{ gap: '0.75rem', color: 'var(--text-primary)' }}>
            <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <Code2 size={24} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
              DSA<span className="text-gradient">Visualizer</span>
            </span>
          </Link>
          
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: location.pathname === '/' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              Home
            </Link>
            <Link to="/problems" style={{ color: location.pathname === '/problems' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              Problems
            </Link>
            <Link to="/topics" style={{ color: location.pathname === '/topics' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              Topics
            </Link>
            <Link to="/paths" style={{ color: location.pathname.startsWith('/paths') ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              Paths
            </Link>
            <Link to="/chatbot" style={{ color: location.pathname === '/chatbot' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Bot size={18} />
                Chat Bot
              </span>
            </Link>
            {user && (
              <Link to="/progress" style={{ color: location.pathname === '/progress' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                Progress
              </Link>
            )}
            {user ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <User size={18} />
                  <span>{user.displayName || user.userName}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                <LogIn size={18} />
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 1rem' }}>
        <Outlet />
      </main>

      {/* Floating chat FAB — hidden on the chatbot page and when widget is open */}
      {!isChatbotPage && !showChatWidget && (
        <button className="chat-fab" onClick={() => setShowChatWidget(true)}>
          <MessageSquare size={18} />
          Chat
        </button>
      )}

      {/* Floating chat widget with animated mount/unmount */}
      <AnimatePresence>
        {showChatWidget && (
          <Chatbot floating onClose={() => setShowChatWidget(false)} />
        )}
      </AnimatePresence>

      <footer style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--surface-border)' }}>
        <div className="container flex-center" style={{ gap: '1rem' }}>
          <p>© {new Date().getFullYear()} DSA Visualizer. Build your coding skills.</p>
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
            <User size={20} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
