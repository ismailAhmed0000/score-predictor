import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  api,
  ApiError,
  type Match,
  type Prediction,
  type PredictionInput,
} from '../api/client';
import { requireAuth } from '../lib/auth';

export const Route = createFileRoute('/matches')({
  beforeLoad: requireAuth,
  component: MatchesPage,
});

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-gray-400';

function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.matches.list();
      setMatches(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  if (loading) {
    return <p className="py-8 text-gray-500">Loading matches…</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-red-600">{error}</p>
    );
  }

  const scheduled = matches.filter((m) => m.status === 'scheduled');
  const finished = matches.filter((m) => m.status === 'finished');

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-gray-900">Match Day</h1>
      <p className="mt-1 text-gray-500">
        Predict scores and top scorer before kickoff
      </p>

      {scheduled.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming</h2>
          <ul className="mt-4 grid gap-4">
            {scheduled.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </ul>
        </section>
      )}

      {finished.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Finished</h2>
          <ul className="mt-4 grid gap-4">
            {finished.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </ul>
        </section>
      )}

      {matches.length === 0 && (
        <p className="mt-6 text-gray-500">No matches found.</p>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [topScorer, setTopScorer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const isOpen =
    match.status === 'scheduled' && new Date(match.kickoffAt) > new Date();

  useEffect(() => {
    let cancelled = false;

    async function loadPrediction() {
      setLoadingPrediction(true);
      try {
        const data = await api.predictions.getMine(match.id);
        if (cancelled) return;
        setPrediction(data);
        if (data) {
          setHomeScore(String(data.predictedHomeScore));
          setAwayScore(String(data.predictedAwayScore));
          setTopScorer(data.predictedTopScorer ?? '');
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load your prediction');
        }
      } finally {
        if (!cancelled) {
          setLoadingPrediction(false);
        }
      }
    }

    void loadPrediction();

    return () => {
      cancelled = true;
    };
  }, [match.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload: PredictionInput = {
      predictedHomeScore: Number(homeScore),
      predictedAwayScore: Number(awayScore),
      predictedTopScorer: topScorer.trim() || undefined,
    };

    try {
      const saved = await api.predictions.save(match.id, payload);
      setPrediction(saved);
      setSuccess(prediction ? 'Prediction updated' : 'Prediction saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save prediction');
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {match.homeTeam} vs {match.awayTeam}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Kickoff: {new Date(match.kickoffAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            match.status === 'finished'
              ? 'bg-gray-100 text-gray-600'
              : 'bg-gray-900 text-white'
          }`}
        >
          {match.status}
        </span>
      </div>

      {match.status === 'finished' && (
        <div className="mt-3 text-sm text-gray-600">
          <p>
            Result:{' '}
            <span className="font-medium text-gray-900">
              {match.homeScore} – {match.awayScore}
            </span>
          </p>
          {match.topScorerName && (
            <p className="mt-1">
              Top scorer: {match.topScorerName} ({match.topScorerGoals} goals)
            </p>
          )}
        </div>
      )}

      {prediction && (
        <p className="mt-3 text-sm text-gray-500">
          Your prediction: {prediction.predictedHomeScore} –{' '}
          {prediction.predictedAwayScore}
          {prediction.predictedTopScorer
            ? ` · ${prediction.predictedTopScorer}`
            : ''}
        </p>
      )}

      {isOpen && !loadingPrediction && (
        <form
          onSubmit={onSubmit}
          className="mt-4 grid gap-3 border-t border-gray-100 pt-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-gray-500">Home score</span>
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
              <span className="mb-1 block text-xs text-gray-500">Away score</span>
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

          <label className="block">
            <span className="mb-1 block text-xs text-gray-500">Top scorer</span>
            <input
              type="text"
              value={topScorer}
              onChange={(e) => setTopScorer(e.target.value)}
              placeholder="Mohamed Salah"
              className={inputClassName}
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : prediction ? 'Update prediction' : 'Save prediction'}
          </button>
        </form>
      )}

      {loadingPrediction && isOpen && (
        <p className="mt-4 text-sm text-gray-500">Loading your prediction…</p>
      )}
    </li>
  );
}
