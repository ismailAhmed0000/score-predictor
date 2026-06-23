import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db, client } from './index';
import { users, teams, matches, matchPredictions } from './schema';

async function seed() {
  // Optional: wipe old data (dev only)
  await db.delete(matchPredictions);
  await db.delete(matches);
  await db.delete(users);
  await db.delete(teams);

  // 1. Teams
  const [arsenal, chelsea, liverpool] = await db
    .insert(teams)
    .values([{ name: 'Arsenal' }, { name: 'Chelsea' }, { name: 'Liverpool' }])
    .returning();

  // 2. Users (PINs are hashed — login with plain PIN below)
  const [alice, bob, charlie] = await db
    .insert(users)
    .values([
      { name: 'Alice', pinHash: await bcrypt.hash('1234', 10) },
      { name: 'Bob', pinHash: await bcrypt.hash('5678', 10) },
      { name: 'Charlie', pinHash: await bcrypt.hash('9999', 10) },
    ])
    .returning();

  // 3. Matches
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
        status: 'finished',
      },
    ])
    .returning();

  // 4. Predictions
  await db.insert(matchPredictions).values([
    {
      userId: alice.id,
      matchId: match1.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    },
    {
      userId: bob.id,
      matchId: match1.id,
      predictedHomeScore: 0,
      predictedAwayScore: 0,
    },
    {
      userId: alice.id,
      matchId: match3.id,
      predictedHomeScore: 2,
      predictedAwayScore: 2,
    },
    {
      userId: charlie.id,
      matchId: match3.id,
      predictedHomeScore: 1,
      predictedAwayScore: 2, // exact score — good for testing scoring
    },
  ]);

  console.log('Seed complete');
  console.log('Login test users:');
  console.log('  Alice   / 1234');
  console.log('  Bob     / 5678');
  console.log('  Charlie / 9999');

  await client.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
