import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { api, ApiError, type LeaderboardEntry } from '../api/client';
import { requireAuth } from '../lib/auth';

export const Route = createFileRoute('/leaderboard')({
  beforeLoad: requireAuth,
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard
      .get()
      .then(setEntries)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : 'Failed to load leaderboard',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-400">Loading leaderboard…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-3 text-red-400">{error}</p>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
      <p className="mt-1 text-slate-400">
        Exact score = 3 pts · Correct outcome = 1 pt · Top scorer = 10 pts +
        goal bonus
      </p>

      {entries.length === 0 ? (
        <p className="mt-6 text-slate-400">
          No finished matches with results yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Exact</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Top Scorer</th>
                <th className="px-4 py-3">Goal Bonus</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.userId} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {entry.name}
                  </td>
                  <td className="px-4 py-3">{entry.exactScorePoints}</td>
                  <td className="px-4 py-3">{entry.outcomePoints}</td>
                  <td className="px-4 py-3">{entry.topScorerPoints}</td>
                  <td className="px-4 py-3">{entry.goalBonusPoints}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">
                    {entry.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
