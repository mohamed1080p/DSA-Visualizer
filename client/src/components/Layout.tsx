import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, User, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

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
