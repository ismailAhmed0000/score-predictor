import { Inject, Injectable } from '@nestjs/common';
import { alias } from 'drizzle-orm/pg-core';
import { DRIZZLE } from 'src/db/database.module';
import { eq } from 'drizzle-orm';
import { teams, matches } from 'src/db/schema';
import { db } from '../db';

const homeTeam = alias(teams, 'home_team');
const awayTeam = alias(teams, 'away_team');

@Injectable()
export class MatchesService {
  constructor(@Inject(DRIZZLE) private readonly dbb: typeof db) {}

  findAll() {
    return this.dbb
      .select({
        id: matches.id,
        kickoffAt: matches.kickoffAt,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        status: matches.status,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
      })
      .from(matches)
      .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id));
  }
}
