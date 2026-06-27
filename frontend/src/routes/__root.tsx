import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { isLoggedIn } from '../api/client';
import { logout } from '../lib/auth';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const loggedIn = isLoggedIn();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold text-emerald-400">
            Score Predictor
          </Link>

          {loggedIn && (
            <nav className="flex items-center gap-4">
              <Link
                to="/matches"
                className="text-sm text-slate-300 hover:text-white [&.active]:font-medium [&.active]:text-white"
                activeProps={{ className: 'active' }}
              >
                Matches
              </Link>
              <Link
                to="/leaderboard"
                className="text-sm text-slate-300 hover:text-white [&.active]:font-medium [&.active]:text-white"
                activeProps={{ className: 'active' }}
              >
                Leaderboard
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
              >
                Logout
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
