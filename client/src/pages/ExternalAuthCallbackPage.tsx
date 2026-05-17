import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { writeStoredAuth, type StoredAuth } from '@/lib/auth-storage';

function parseAuthPayload(): StoredAuth | null {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  const rawAuth = params.get('auth');
  if (!rawAuth) return null;

  try {
    return JSON.parse(decodeURIComponent(rawAuth)) as StoredAuth;
  } catch {
    return null;
  }
}

export default function ExternalAuthCallbackPage() {
  const navigate = useNavigate();
  const auth = useMemo(() => parseAuthPayload(), []);

  useEffect(() => {
    if (!auth?.accessToken || !auth?.email) {
      navigate('/login', { replace: true });
      return;
    }

    writeStoredAuth(auth);
    navigate('/progress', { replace: true });
  }, [auth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Signing you in...
    </div>
  );
}