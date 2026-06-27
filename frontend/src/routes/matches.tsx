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
    return <p className="text-slate-400">Loading matches…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-3 text-red-400">{error}</p>
    );
  }

  const scheduled = matches.filter((m) => m.status === 'scheduled');
  const finished = matches.filter((m) => m.status === 'finished');

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Matches</h1>
      <p className="mt-1 text-slate-400">
        Predict scores and top scorer before kickoff
      </p>

      {scheduled.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Upcoming</h2>
          <ul className="mt-4 grid gap-4">
            {scheduled.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </ul>
        </section>
      )}

      {finished.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Finished</h2>
          <ul className="mt-4 grid gap-4">
            {finished.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </ul>
        </section>
      )}

      {matches.length === 0 && (
        <p className="mt-6 text-slate-400">No matches found.</p>
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
    <li className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {match.homeTeam} vs {match.awayTeam}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Kickoff: {new Date(match.kickoffAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            match.status === 'finished'
              ? 'bg-slate-700 text-slate-300'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {match.status}
        </span>
      </div>

      {match.status === 'finished' && (
        <div className="mt-3 text-sm text-slate-300">
          <p>
            Result:{' '}
            <span className="font-medium text-emerald-400">
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
        <p className="mt-3 text-sm text-slate-400">
          Your prediction: {prediction.predictedHomeScore} –{' '}
          {prediction.predictedAwayScore}
          {prediction.predictedTopScorer
            ? ` · ${prediction.predictedTopScorer}`
            : ''}
        </p>
      )}

      {isOpen && !loadingPrediction && (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 border-t border-slate-800 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Home score</span>
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Away score</span>
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Top scorer</span>
            <input
              type="text"
              value={topScorer}
              onChange={(e) => setTopScorer(e.target.value)}
              placeholder="Mohamed Salah"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? 'Saving…' : prediction ? 'Update prediction' : 'Save prediction'}
          </button>
        </form>
      )}

      {loadingPrediction && isOpen && (
        <p className="mt-4 text-sm text-slate-500">Loading your prediction…</p>
      )}
    </li>
  );
}
