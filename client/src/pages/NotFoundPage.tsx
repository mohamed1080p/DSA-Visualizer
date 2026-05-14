import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Route not in graph</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This node doesn&apos;t exist in our routing tree. Backtrack and try again.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
