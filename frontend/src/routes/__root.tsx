import {
  Link,
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { getUser, isLoggedIn } from "../api/client";
import { logout } from "../lib/auth";
import { Logo } from "../components/Logo";

export const Route = createRootRoute({
  component: RootLayout,
});

const navLinkClass =
  "rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900";
const navLinkActiveClass =
  "rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white";

function RootLayout() {
  const loggedIn = isLoggedIn();
  const user = getUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/login";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-gray-900">
      {!isLogin && (
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6">
          <Link to="/matches" className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            {loggedIn && user?.name && (
              <span className="text-sm font-semibold text-gray-900">
                {user.name}
              </span>
            )}
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-gray-200/80 bg-white p-1 shadow-sm">
            <Link
              to="/matches"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
            >
              Match Day
            </Link>
            <Link
              to="/leaderboard"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
            >
              Leaderboard
            </Link>
            {loggedIn && user?.isAdmin ? (
              <Link
                to="/admin"
                className={navLinkClass}
                activeProps={{ className: navLinkActiveClass }}
              >
                Admin
              </Link>
            ) : null}
            {loggedIn ? (
              <button
                type="button"
                onClick={() => logout()}
                className={navLinkClass}
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className={navLinkClass}
                activeProps={{ className: navLinkActiveClass }}
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
        <Outlet />
      </main>
    </div>
  );
}
