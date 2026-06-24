import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import { db } from '../db';
import { matchPredictions, matches, users } from '../db/schema';
import { scorePrediction } from '../scoring/scoring';

@Injectable()
export class LeaderboardService {
  constructor(@Inject(DRIZZLE) private readonly dbb: typeof db) {}

  async getLeaderboard() {
    const finishedMatches = await this.dbb
      .select()
      .from(matches)
      .where(eq(matches.status, 'finished'));

    if (finishedMatches.length === 0) {
      return [];
    }

    const matchIds = finishedMatches.map((m) => m.id);
    const matchById = new Map(finishedMatches.map((m) => [m.id, m]));

    const predictions = await this.dbb
      .select()
      .from(matchPredictions)
      .where(inArray(matchPredictions.matchId, matchIds));

    const allUsers = await this.dbb.select().from(users);
    const totalsByUserId = new Map(
      allUsers.map((u) => [
        u.id,
        {
          exactScorePoints: 0,
          outcomePoints: 0,
          topScorerPoints: 0,
          goalBonusPoints: 0,
          total: 0,
        },
      ]),
    );

    for (const prediction of predictions) {
      const match = matchById.get(prediction.matchId);
      if (
        !match ||
        match.homeScore == null ||
        match.awayScore == null ||
        match.topScorerName == null ||
        match.topScorerGoals == null
      ) {
        continue;
      }

      const breakdown = scorePrediction(
        {
          predictedHomeScore: prediction.predictedHomeScore,
          predictedAwayScore: prediction.predictedAwayScore,
          predictedTopScorer: prediction.predictedTopScorer,
        },
        {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          topScorerName: match.topScorerName,
          topScorerGoals: match.topScorerGoals,
        },
      );

      const current = totalsByUserId.get(prediction.userId);
      if (!current) {
        continue;
      }

      current.exactScorePoints += breakdown.exactScorePoints;
      current.outcomePoints += breakdown.outcomePoints;
      current.topScorerPoints += breakdown.topScorerPoints;
      current.goalBonusPoints += breakdown.goalBonusPoints;
      current.total += breakdown.total;
    }

    return allUsers
      .map((user) => {
        const points = totalsByUserId.get(user.id)!;
        return {
          userId: user.id,
          name: user.name,
          ...points,
        };
      })
      .sort((a, b) => b.total - a.total);
  }
}
