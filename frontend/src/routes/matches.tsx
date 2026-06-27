import { Link, createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  api,
  ApiError,
  getUser,
  type Match,
  type Prediction,
  type PredictionInput,
} from '../api/client';
import { requireAuth } from '../lib/auth';

export const Route = createFileRoute('/matches')({
  beforeLoad: requireAuth,
  component: MatchesPage,
});

const accentPink = 'text-[#ff3366]';
const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400';

function formatMatchDayHeader(date: Date): string {
  const day = date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();
  return `MATCH DAY · ${day}`;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function matchGroup(id: number): string {
  return `GROUP ${String.fromCharCode(65 + ((id - 1) % 8))}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function useCountdown(targetMs: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (targetMs === null) return null;

  const diff = Math.max(0, targetMs - now);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictionsByMatchId, setPredictionsByMatchId] = useState<
    Record<number, Prediction | null>
  >({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const user = getUser();

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.matches.list();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
      );
      setMatches(sorted);

      const predictionEntries = await Promise.all(
        sorted.map(async (match) => {
          const prediction = await api.predictions.getMine(match.id);
          return [match.id, prediction] as const;
        }),
      );
      setPredictionsByMatchId(Object.fromEntries(predictionEntries));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const handlePredictionSaved = useCallback(
    (matchId: number, prediction: Prediction) => {
      setPredictionsByMatchId((prev) => ({ ...prev, [matchId]: prediction }));
    },
    [],
  );

  const today = new Date();
  const todayMatches = matches.filter((m) =>
    isSameDay(new Date(m.kickoffAt), today),
  );
  const displayMatches = todayMatches.length > 0 ? todayMatches : matches;
  const fixtureCount = todayMatches.length || matches.length;

  const upcomingMatches = useMemo(() => {
    const now = Date.now();
    return matches.filter(
      (m) => m.status === 'scheduled' && new Date(m.kickoffAt).getTime() > now,
    );
  }, [matches]);

  const nextKickoffMatch = upcomingMatches[0] ?? null;

  const countdown = useCountdown(
    nextKickoffMatch
      ? new Date(nextKickoffMatch.kickoffAt).getTime()
      : null,
  );

  if (loading) {
    return <p className="py-12 text-center text-gray-500">Loading matches…</p>;
  }

  if (error) {
    return (
      <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="py-6 pb-12">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold tracking-widest text-gray-400">
            {formatMatchDayHeader(today)}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Call the score.
            <br />
            Top the office.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
            Lock in your prediction before kickoff — exact score earns 3 points,
            correct outcome (win or draw) earns 1. Pick the tournament top scorer
            for 10 more, plus a goal bonus.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/leaderboard"
              className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              View leaderboard
            </Link>
            <span className="text-sm text-gray-400">
              {fixtureCount} fixture{fixtureCount === 1 ? '' : 's'} today
            </span>
          </div>
        </section>

        <section className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-widest text-gray-400">
            NEXT KICKOFF
          </p>
          {nextKickoffMatch && countdown ? (
            <>
              <div className="mt-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ff3366]" />
                <p
                  className={`font-mono text-4xl font-bold tracking-tight ${accentPink}`}
                >
                  {countdown}
                </p>
              </div>
              <div className="mt-auto rounded-2xl bg-[#f5f6f8] px-4 py-4">
                <p className="font-semibold text-gray-900">
                  {nextKickoffMatch.homeTeam} vs {nextKickoffMatch.awayTeam}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {matchGroup(nextKickoffMatch.id)} ·{' '}
                  {formatKickoff(nextKickoffMatch.kickoffAt)}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No upcoming kickoffs.</p>
          )}
        </section>
      </div>

      <TopScorerSection userName={user?.name} />

      <section className="mt-4">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            {todayMatches.length > 0 ? "Today's matches" : 'All matches'}
          </h2>
          <span className="rounded-full bg-gray-200/80 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
            {displayMatches.length}
          </span>
        </div>

        {displayMatches.length === 0 ? (
          <p className="text-gray-500">No matches found.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {displayMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                initialPrediction={predictionsByMatchId[match.id] ?? null}
                onSaved={handlePredictionSaved}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TopScorerSection({ userName }: { userName?: string }) {
  const [topScorer, setTopScorer] = useState('');
  const [savedTopScorer, setSavedTopScorer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { tournamentTopScorer } = await api.auth.getTournamentTopScorer();
        if (cancelled) return;
        setSavedTopScorer(tournamentTopScorer);
        setTopScorer(tournamentTopScorer ?? '');
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load your top scorer pick',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const { tournamentTopScorer } = await api.auth.setTournamentTopScorer(
        topScorer.trim(),
      );
      setSavedTopScorer(tournamentTopScorer);
      setTopScorer(tournamentTopScorer ?? '');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to save top scorer pick',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Your top scorer pick</h2>
      <p className="mt-6 text-xs font-semibold tracking-widest text-gray-400">
        WHO ARE YOU?
      </p>
      <div className="mt-2 rounded-xl border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-900">
        {userName ?? 'Player'}
      </div>
      <p className="mt-3 text-sm text-gray-400">
        Pick one player for the whole tournament — 10 points if they top score,
        plus a goal bonus.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 border-t border-gray-100 pt-6">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold tracking-widest text-gray-400">
            TOP SCORER
          </span>
          <input
            type="text"
            value={topScorer}
            onChange={(e) => setTopScorer(e.target.value)}
            placeholder="Player name"
            className={inputClassName}
            disabled={loading}
            required
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || saving}
          className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : savedTopScorer ? 'Update pick' : 'Save pick'}
        </button>
      </form>

      {savedTopScorer && !loading && (
        <p className="mt-4 text-sm text-gray-600">
          Current pick:{' '}
          <span className="font-semibold text-gray-900">{savedTopScorer}</span>
        </p>
      )}
    </section>
  );
}

function MatchCard({
  match,
  initialPrediction,
  onSaved,
}: {
  match: Match;
  initialPrediction: Prediction | null;
  onSaved: (matchId: number, prediction: Prediction) => void;
}) {
  const [prediction, setPrediction] = useState<Prediction | null>(
    initialPrediction,
  );
  const [homeScore, setHomeScore] = useState(
    () => String(initialPrediction?.predictedHomeScore ?? 0),
  );
  const [awayScore, setAwayScore] = useState(
    () => String(initialPrediction?.predictedAwayScore ?? 0),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isOpen =
    match.status === 'scheduled' &&
    new Date(match.kickoffAt).getTime() > Date.now();
  const isFinished = match.status === 'finished';

  useEffect(() => {
    setPrediction(initialPrediction);
    if (initialPrediction) {
      setHomeScore(String(initialPrediction.predictedHomeScore));
      setAwayScore(String(initialPrediction.predictedAwayScore));
    }
  }, [initialPrediction]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload: PredictionInput = {
      predictedHomeScore: Number(homeScore),
      predictedAwayScore: Number(awayScore),
    };

    try {
      const saved = prediction
        ? await api.predictions.update(match.id, payload)
        : await api.predictions.create(match.id, payload);
      setPrediction(saved);
      setExpanded(false);
      onSaved(match.id, saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save prediction');
    } finally {
      setSaving(false);
    }
  }

  const displayHome = isFinished ? (match.homeScore ?? 0) : null;
  const displayAway = isFinished ? (match.awayScore ?? 0) : null;

  return (
    <li className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide text-gray-400">
          {matchGroup(match.id)}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isFinished
              ? 'bg-emerald-50 text-emerald-700'
              : isOpen
                ? 'bg-gray-100 text-gray-600'
                : 'bg-amber-50 text-amber-700'
          }`}
        >
          {isFinished
            ? 'Full time'
            : isOpen
              ? 'Upcoming'
              : 'Predictions closed'}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-gray-900">
          {match.homeTeam}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {isFinished ? (
            <>
              <span className="rounded-lg bg-[#f5f6f8] px-3 py-1.5 text-lg font-bold text-gray-900">
                {displayHome}
              </span>
              <span className="text-gray-300">-</span>
              <span className="rounded-lg bg-[#f5f6f8] px-3 py-1.5 text-lg font-bold text-gray-900">
                {displayAway}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-400">vs</span>
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-gray-900">
          {match.awayTeam}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-gray-400">
        <span>{formatKickoff(match.kickoffAt)}</span>
        <span>
          {isFinished
            ? 'Result in'
            : isOpen
              ? 'Predict score'
              : 'Kickoff passed'}
        </span>
      </div>

      {prediction && !expanded && (
        <p className="mt-3 rounded-xl bg-[#f5f6f8] px-3 py-2 text-xs text-gray-600">
          Your pick: {prediction.predictedHomeScore} –{' '}
          {prediction.predictedAwayScore}
        </p>
      )}

      {isOpen && (
        <>
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-4 w-full rounded-full border border-gray-200 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
              {prediction ? 'Edit prediction' : 'Make prediction'}
            </button>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-400">
                    {match.homeTeam}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-400">
                    {match.awayTeam}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </label>
              </div>
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex-1 rounded-full border border-gray-200 py-2 text-sm font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-full bg-gray-900 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

    </li>
  );
}
