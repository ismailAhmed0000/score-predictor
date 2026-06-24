import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { alias } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import { db } from '../db';
import { teams, matches } from '../db/schema';
import { SetMatchResultDto } from './set-match-result.dto';

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
        topScorerName: matches.topScorerName,
        topScorerGoals: matches.topScorerGoals,
        status: matches.status,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
      })
      .from(matches)
      .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id));
  }

  async setResult(matchId: number, dto: SetMatchResultDto) {
    const [match] = await this.dbb
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const [updated] = await this.dbb
      .update(matches)
      .set({
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
        topScorerName: dto.topScorerName,
        topScorerGoals: dto.topScorerGoals,
        status: 'finished',
      })
      .where(eq(matches.id, matchId))
      .returning();

    return updated;
  }
}
