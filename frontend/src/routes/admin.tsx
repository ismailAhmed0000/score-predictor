import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  api,
  ApiError,
  type AdminFixture,
  type AdminParticipant,
  type AdminPrediction,
  type AdminTopScorerPick,
} from '../api/client';
import { logout, requireAdmin } from '../lib/auth';

export const Route = createFileRoute('/admin')({
  beforeLoad: requireAdmin,
  component: AdminPage,
});

type Tab = 'fixtures' | 'predictions' | 'top-scorer' | 'participants';

const tabs: { id: Tab; label: string }[] = [
  { id: 'fixtures', label: 'Fixtures & Results' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'top-scorer', label: 'Top Scorer' },
  { id: 'participants', label: 'Participants' },
];

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400';

const actionButtonClassName =
  'rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900';

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminPage() {
  const [tab, setTab] = useState<Tab>('fixtures');
  const [fixtures, setFixtures] = useState<AdminFixture[]>([]);
  const [predictions, setPredictions] = useState<AdminPrediction[]>([]);
  const [topScorerPicks, setTopScorerPicks] = useState<AdminTopScorerPick[]>(
    [],
  );
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [fixtureData, predictionData, pickData, participantData] =
        await Promise.all([
          api.admin.listFixtures(),
          api.admin.listPredictions(),
          api.admin.listTopScorerPicks(),
          api.admin.listParticipants(),
        ]);
      setFixtures(fixtureData);
      setPredictions(predictionData);
      setTopScorerPicks(pickData);
      setParticipants(participantData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleExportStandings() {
    try {
      await api.admin.exportStandingsCsv();
      setMessage('Standings exported.');
    } catch {
      setMessage('Failed to export standings.');
    }
  }

  async function handleExportPins() {
    try {
      await api.admin.exportPinsCsv();
      setMessage('PINs exported.');
    } catch {
      setMessage('Failed to export PINs.');
    }
  }

  async function handleRecalculate() {
    try {
      await api.admin.recalculate();
      setMessage('Points recalculated.');
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : 'Failed to recalculate points',
      );
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-gray-500">Loading admin…</p>;
  }

  return (
    <div className="py-6 pb-12">
      <section className="rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-gray-400">
          TOURNAMENT MANAGEMENT
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Admin Dashboard
        </h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleExportStandings()}
            className={actionButtonClassName}
          >
            Export Standings (CSV)
          </button>
          <button
            type="button"
            onClick={() => void handleExportPins()}
            className={actionButtonClassName}
          >
            Export PINs (CSV)
          </button>
          <button
            type="button"
            onClick={() => void handleRecalculate()}
            className={actionButtonClassName}
          >
            Recalculate Points
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className={`${actionButtonClassName} ml-auto`}
          >
            Sign Out
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-gray-200/80 bg-[#eef0f3] p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'fixtures' && (
        <FixturesTab fixtures={fixtures} onRefresh={loadAll} />
      )}
      {tab === 'predictions' && <PredictionsTab predictions={predictions} />}
      {tab === 'top-scorer' && <TopScorerTab picks={topScorerPicks} />}
      {tab === 'participants' && (
        <ParticipantsTab participants={participants} onRefresh={loadAll} />
      )}
    </div>
  );
}

function FixturesTab({
  fixtures,
  onRefresh,
}: {
  fixtures: AdminFixture[];
  onRefresh: () => Promise<void>;
}) {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [kickoffAt, setKickoffAt] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onAddFixture(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.admin.createFixture({ homeTeam, awayTeam, kickoffAt });
      setHomeTeam('');
      setAwayTeam('');
      setKickoffAt('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add fixture');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Add Fixture</h2>
        <form onSubmit={onAddFixture} className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              placeholder="Home team"
              className={inputClassName}
              required
            />
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              placeholder="Away team"
              className={inputClassName}
              required
            />
            <input
              type="datetime-local"
              value={kickoffAt}
              onChange={(e) => setKickoffAt(e.target.value)}
              className={inputClassName}
              required
            />
            <select className={inputClassName} defaultValue="group">
              <option value="group">Group Stage</option>
            </select>
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add Fixture'}
          </button>
        </form>
      </section>

      {fixtures.map((fixture) => (
        <FixtureCard key={fixture.id} fixture={fixture} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function FixtureCard({
  fixture,
  onRefresh,
}: {
  fixture: AdminFixture;
  onRefresh: () => Promise<void>;
}) {
  const [homeScore, setHomeScore] = useState(String(fixture.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(fixture.awayScore ?? 0));
  const [topScorerName, setTopScorerName] = useState(
    fixture.topScorerName ?? '',
  );
  const [topScorerGoals, setTopScorerGoals] = useState(
    String(fixture.topScorerGoals ?? 0),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isFinished = fixture.status === 'finished';

  async function onUpdateResult(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.admin.updateResult(fixture.id, {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        topScorerName: topScorerName.trim() || undefined,
        topScorerGoals: Number(topScorerGoals),
      });
      await onRefresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update result');
    } finally {
      setSaving(false);
    }
  }

  async function onReopen() {
    try {
      await api.admin.reopenFixture(fixture.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reopen fixture');
    }
  }

  async function onDelete() {
    if (!window.confirm('Delete this fixture and all predictions?')) return;
    try {
      await api.admin.deleteFixture(fixture.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete fixture');
    }
  }

  function onCopyLink() {
    void navigator.clipboard.writeText(
      `${window.location.origin}/matches`,
    );
  }

  return (
    <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {fixture.homeTeam} vs {fixture.awayTeam}{' '}
            <span className="text-sm font-normal text-gray-400">
              match-{fixture.id}
            </span>
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Group Stage · {formatKickoff(fixture.kickoffAt)} ·{' '}
            {fixture.predictionCount} prediction
            {fixture.predictionCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isFinished ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Completed {fixture.homeScore}-{fixture.awayScore}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Scheduled
            </span>
          )}
          <button type="button" onClick={onCopyLink} className={actionButtonClassName}>
            Copy Link
          </button>
          <button type="button" onClick={() => void onDelete()} className={actionButtonClassName}>
            Delete
          </button>
        </div>
      </div>

      <form onSubmit={onUpdateResult} className="mt-5 space-y-4">
        <div className="grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3">
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className={inputClassName}
          />
          <span className="text-gray-300">-</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={topScorerName}
            onChange={(e) => setTopScorerName(e.target.value)}
            placeholder="Match top scorer"
            className={inputClassName}
          />
          <input
            type="number"
            min={0}
            value={topScorerGoals}
            onChange={(e) => setTopScorerGoals(e.target.value)}
            placeholder="Goals"
            className={inputClassName}
          />
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Update Result'}
          </button>
          {isFinished && (
            <button
              type="button"
              onClick={() => void onReopen()}
              className={actionButtonClassName}
            >
              Reopen
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function PredictionsTab({ predictions }: { predictions: AdminPrediction[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold tracking-widest text-gray-400">
              <th className="px-6 py-4">Participant</th>
              <th className="px-6 py-4">Match</th>
              <th className="px-6 py-4">Prediction</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {predictions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-gray-500">
                  No predictions yet.
                </td>
              </tr>
            ) : (
              predictions.map((prediction) => (
                <tr key={prediction.id} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {prediction.userName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {prediction.homeTeam} vs {prediction.awayTeam}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {prediction.predictedHomeScore} –{' '}
                    {prediction.predictedAwayScore}
                  </td>
                  <td className="px-6 py-4 capitalize text-gray-500">
                    {prediction.matchStatus}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopScorerTab({ picks }: { picks: AdminTopScorerPick[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold tracking-widest text-gray-400">
              <th className="px-6 py-4">Participant</th>
              <th className="px-6 py-4">Tournament Top Scorer Pick</th>
            </tr>
          </thead>
          <tbody>
            {picks.map((pick) => (
              <tr key={pick.id} className="border-t border-gray-100">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {pick.name}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {pick.tournamentTopScorer ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ParticipantsTab({
  participants,
  onRefresh,
}: {
  participants: AdminParticipant[];
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [createdPin, setCreatedPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setCreatedPin('');
    setSaving(true);
    try {
      const result = await api.admin.createParticipant({
        name,
        pin: pin || undefined,
      });
      setCreatedPin(result.pin);
      setName('');
      setPin('');
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to create participant',
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(userId: number) {
    if (!window.confirm('Delete this participant and their predictions?')) return;
    try {
      await api.admin.deleteParticipant(userId);
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to delete participant',
      );
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Add Participant</h2>
        <form onSubmit={onCreate} className="mt-4 flex flex-wrap gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className={`${inputClassName} max-w-xs`}
            required
          />
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN (optional, 4 digits)"
            className={`${inputClassName} max-w-xs`}
            pattern="\d{4}"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add Participant'}
          </button>
        </form>
        {createdPin && (
          <p className="mt-3 text-sm text-emerald-700">
            Participant created. PIN: <strong>{createdPin}</strong>
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>

      <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold tracking-widest text-gray-400">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Top Scorer Pick</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.id} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {participant.name}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {participant.tournamentTopScorer ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => void onDelete(participant.id)}
                      className={actionButtonClassName}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
