import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import { db } from '../db';
import { matches, matchPredictions } from '../db/schema';
import { CreatePredictionDto } from './create-prediction.dto';

@Injectable()
export class PredictionsService {
  constructor(@Inject(DRIZZLE) private readonly dbb: typeof db) {}

  private async getOpenMatchOrThrow(matchId: number) {
    const [match] = await this.dbb
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (new Date() >= match.kickoffAt) {
      throw new BadRequestException('Match already started');
    }

    return match;
  }

  async create(matchId: number, userId: number, dto: CreatePredictionDto) {
    await this.getOpenMatchOrThrow(matchId);

    try {
      const [prediction] = await this.dbb
        .insert(matchPredictions)
        .values({
          userId,
          matchId,
          predictedHomeScore: dto.predictedHomeScore,
          predictedAwayScore: dto.predictedAwayScore,
          predictedTopScorer: dto.predictedTopScorer ?? null,
        })
        .returning();

      return prediction;
    } catch {
      throw new ConflictException('Prediction already exists for this match');
    }
  }

  async update(matchId: number, userId: number, dto: CreatePredictionDto) {
    await this.getOpenMatchOrThrow(matchId);

    const [prediction] = await this.dbb
      .select()
      .from(matchPredictions)
      .where(
        and(
          eq(matchPredictions.matchId, matchId),
          eq(matchPredictions.userId, userId),
        ),
      );

    if (!prediction) {
      throw new NotFoundException('Prediction not found');
    }

    const [updated] = await this.dbb
      .update(matchPredictions)
      .set({
        predictedHomeScore: dto.predictedHomeScore,
        predictedAwayScore: dto.predictedAwayScore,
        predictedTopScorer: dto.predictedTopScorer ?? null,
        updatedAt: new Date(),
      })
      .where(eq(matchPredictions.id, prediction.id))
      .returning();

    return updated;
  }

  async findMine(matchId: number, userId: number) {
    const [prediction] = await this.dbb
      .select()
      .from(matchPredictions)
      .where(
        and(
          eq(matchPredictions.matchId, matchId),
          eq(matchPredictions.userId, userId),
        ),
      );
    return prediction ?? null;
  }
}
