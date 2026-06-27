import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  pinHash: text('pin_hash').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  lastIssuedPin: text('last_issued_pin'),
  tournamentTopScorer: text('tournament_top_scorer'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  homeTeamId: integer('home_team_id')
    .notNull()
    .references(() => teams.id),
  awayTeamId: integer('away_team_id')
    .notNull()
    .references(() => teams.id),
  kickoffAt: timestamp('kickoff_at').notNull(),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  topScorerName: text('top_scorer_name'),
  topScorerGoals: integer('top_scorer_goals'),
  status: text('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const matchPredictions = pgTable(
  'match_predictions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    matchId: integer('match_id')
      .notNull()
      .references(() => matches.id),
    predictedHomeScore: integer('predicted_home_score').notNull(),
    predictedAwayScore: integer('predicted_away_score').notNull(),
    predictedTopScorer: text('predicted_top_scorer'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [unique().on(table.userId, table.matchId)],
);
