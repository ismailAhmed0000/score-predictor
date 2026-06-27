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
    return <p className="py-8 text-gray-500">Loading leaderboard…</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-red-600">{error}</p>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
      <p className="mt-1 text-gray-500">
        Exact score = 3 pts · Correct outcome = 1 pt · Top scorer = 10 pts +
        goal bonus
      </p>

      {entries.length === 0 ? (
        <p className="mt-6 text-gray-500">
          No finished matches with results yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Exact</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Top Scorer</th>
                <th className="px-4 py-3 font-medium">Goal Bonus</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.userId} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {entry.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.exactScorePoints}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.outcomePoints}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.topScorerPoints}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.goalBonusPoints}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
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
