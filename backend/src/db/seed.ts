import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db, client } from './index';
import { users, teams, matches, matchPredictions } from './schema';

async function seed() {
  await db.delete(matchPredictions);
  await db.delete(matches);
  await db.delete(users);
  await db.delete(teams);

  const [arsenal, chelsea, liverpool] = await db
    .insert(teams)
    .values([{ name: 'Arsenal' }, { name: 'Chelsea' }, { name: 'Liverpool' }])
    .returning();

  const [alice, bob, charlie] = await db
    .insert(users)
    .values([
      { name: 'Alice', pinHash: await bcrypt.hash('1234', 10) },
      { name: 'Bob', pinHash: await bcrypt.hash('5678', 10) },
      { name: 'Charlie', pinHash: await bcrypt.hash('9999', 10) },
    ])
    .returning();

  const [match1, match2, match3] = await db
    .insert(matches)
    .values([
      {
        homeTeamId: arsenal.id,
        awayTeamId: chelsea.id,
        kickoffAt: new Date('2026-06-28T15:00:00Z'),
        status: 'scheduled',
      },
      {
        homeTeamId: liverpool.id,
        awayTeamId: arsenal.id,
        kickoffAt: new Date('2026-07-05T15:00:00Z'),
        status: 'scheduled',
      },
      {
        homeTeamId: chelsea.id,
        awayTeamId: liverpool.id,
        kickoffAt: new Date('2026-06-20T15:00:00Z'),
        homeScore: 1,
        awayScore: 2,
        topScorerName: 'Mohamed Salah',
        topScorerGoals: 2,
        status: 'finished',
      },
    ])
    .returning();

  await db.insert(matchPredictions).values([
    {
      userId: alice.id,
      matchId: match1.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      predictedTopScorer: 'Bukayo Saka',
    },
    {
      userId: bob.id,
      matchId: match1.id,
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedTopScorer: 'Cole Palmer',
    },
    {
      userId: alice.id,
      matchId: match3.id,
      predictedHomeScore: 2,
      predictedAwayScore: 2,
      predictedTopScorer: 'Mohamed Salah',
    },
    {
      userId: charlie.id,
      matchId: match3.id,
      predictedHomeScore: 1,
      predictedAwayScore: 2,
      predictedTopScorer: 'Mohamed Salah',
    },
  ]);

  console.log('Seed complete');
  console.log('Login test users:');
  console.log('  Alice   / 1234');
  console.log('  Bob     / 5678');
  console.log('  Charlie / 9999');
  console.log('');
  console.log('Finished match 3 scoring (Charlie example):');
  console.log('  Exact score 1-2 = 3 pts');
  console.log('  Top scorer Salah = 10 pts + 2 goal bonus = 12 pts');
  console.log('  Total for match 3 = 15 pts');

  await client.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
