import { resolveApiUrl } from '@/lib/api-client';

type OAuthButtonProps = Readonly<{
  href: string;
  label: string;
  icon: React.ReactNode;
}>;

function OAuthButton({ href, label, icon }: OAuthButtonProps) {
  return (
    <a
      href={href}
      className="flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm font-medium transition-colors hover:border-primary/40"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.54 2.87 8.39 6.84 9.75.5.1.66-.22.66-.48v-1.7c-2.78.62-3.37-1.35-3.37-1.35-.45-1.17-1.1-1.48-1.1-1.48-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.58 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.13-4.56-5.04 0-1.11.38-2.02 1-2.73-.1-.26-.43-1.31.1-2.72 0 0 .84-.27 2.75 1.04a9.3 9.3 0 0 1 5 0c1.91-1.31 2.75-1.04 2.75-1.04.53 1.41.2 2.46.1 2.72.62.71 1 1.62 1 2.73 0 3.92-2.34 4.77-4.57 5.03.36.32.68.95.68 1.92v2.85c0 .26.16.58.67.48A10.25 10.25 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function OAuthButtons() {
  return (
    <>
      <OAuthButton
        href={resolveApiUrl('/api/Auth/external-login?provider=GitHub')}
        label="GitHub"
        icon={<GitHubIcon />}
      />
      <OAuthButton
        href={resolveApiUrl('/api/Auth/external-login?provider=Google')}
        label="Google"
        icon={<GoogleIcon />}
      />
      
    </>
  );
}