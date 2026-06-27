import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api, ApiError, setToken } from "../api/client";
import { Logo } from "../components/Logo";
import { redirectIfLoggedIn } from "../lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfLoggedIn,
  component: LoginPage,
});

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400";

function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { accessToken } = await api.auth.login(name.trim(), pin);
      setToken(accessToken);
      navigate({ to: "/matches" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="h-12 w-12" />
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          LOGIN
        </h1>
        <p className="mt-3 text-center text-sm text-gray-500">
          Enter your name and PIN to join the tournament.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className={inputClassName}
            autoComplete="username"
            required
          />

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className={inputClassName}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
