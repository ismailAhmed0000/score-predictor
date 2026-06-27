import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { api, ApiError, type LeaderboardEntry } from '../api/client';
import { requireAuth } from '../lib/auth';

export const Route = createFileRoute('/leaderboard')({
  beforeLoad: requireAuth,
  component: LeaderboardPage,
});

const podiumStyles = [
  { avatar: 'bg-emerald-100 text-emerald-700', label: 'RANK 1' },
  { avatar: 'bg-amber-100 text-amber-700', label: 'RANK 2' },
  { avatar: 'bg-rose-100 text-rose-600', label: 'RANK 3' },
] as const;

function participantInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function matchPoints(entry: LeaderboardEntry): number {
  return entry.exactScorePoints + entry.outcomePoints;
}

function scorerPoints(entry: LeaderboardEntry): number {
  return entry.topScorerPoints + entry.goalBonusPoints;
}

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
    return <p className="py-12 text-center text-gray-500">Loading leaderboard…</p>;
  }

  if (error) {
    return (
      <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-600">{error}</p>
    );
  }

  const topThree = entries.slice(0, 3);

  return (
    <div className="py-6 pb-12">
      <section className="rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-gray-400">
          STANDINGS
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Exact score = 3 pts · Correct outcome (win or draw) = 1 pt · Top scorer
          = 10 pts + goal bonus
        </p>
      </section>

      {entries.length === 0 ? (
        <p className="mt-6 text-gray-500">No participants yet.</p>
      ) : (
        <>
          {topThree.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {topThree.map((entry, index) => {
                const style = podiumStyles[index] ?? podiumStyles[2];
                return (
                  <div
                    key={entry.userId}
                    className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${style.avatar}`}
                      >
                        {participantInitial(entry.name)}
                      </div>
                      <span className="text-xs font-semibold tracking-widest text-gray-400">
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-5 text-lg font-bold text-gray-900">
                      {entry.name}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {entry.total}{' '}
                      <span className="text-base font-semibold text-gray-500">
                        pts
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold tracking-widest text-gray-400">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Participant</th>
                    <th className="px-6 py-4">Match</th>
                    <th className="px-6 py-4">Scorer</th>
                    <th className="px-6 py-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const rank = index + 1;
                    const isLeader = rank === 1;
                    const avatarStyle =
                      index < 3
                        ? podiumStyles[index].avatar
                        : 'bg-gray-100 text-gray-600';

                    return (
                      <tr
                        key={entry.userId}
                        className="border-t border-gray-100"
                      >
                        <td className="px-6 py-4 text-gray-500">{rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarStyle}`}
                            >
                              {participantInitial(entry.name)}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {entry.name}
                              </span>
                              {isLeader && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                  Leader
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {matchPoints(entry)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {scorerPoints(entry)}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {entry.total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
