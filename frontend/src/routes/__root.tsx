import {
  Link,
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { isLoggedIn } from "../api/client";
import { logout } from "../lib/auth";
import { AppFooter } from "../components/AppFooter";
import { Logo } from "../components/Logo";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const loggedIn = isLoggedIn();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/login";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-gray-900">
      {!isLogin && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-6">
          <header className="flex items-center justify-between rounded-full border border-gray-200/80 bg-white px-5 py-3 shadow-sm">
            <Link to="/" className="flex items-center">
              <Logo />
            </Link>

            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link
                to="/matches"
                className="transition hover:text-gray-900 [&.active]:text-gray-900"
                activeProps={{ className: "active" }}
              >
                Match Day
              </Link>
              <Link
                to="/leaderboard"
                className="transition hover:text-gray-900 [&.active]:text-gray-900"
                activeProps={{ className: "active" }}
              >
                Leaderboard
              </Link>
              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                >
                  Admin
                </Link>
              )}
            </nav>
          </header>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4">
        <Outlet />
      </main>

      {/* <div className="mx-auto w-full max-w-4xl px-4">
        <AppFooter />
      </div> */}
    </div>
  );
}
