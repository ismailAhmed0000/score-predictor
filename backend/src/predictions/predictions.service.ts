import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from 'src/db/database.module';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { CreatePredictionDto } from './create-prediction.dto';

import { matches, matchPredictions } from 'src/db/schema';

@Injectable()
export class PredictionsService {
  constructor(@Inject(DRIZZLE) private readonly dbb: typeof db) {}

  async create(matchId: number, userId: number, dto: CreatePredictionDto) {
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

    try {
      const [prediction] = await this.dbb
        .insert(matchPredictions)
        .values({
          userId,
          matchId,
          predictedHomeScore: dto.predictedHomeScore,
          predictedAwayScore: dto.predictedAwayScore,
        })
        .returning();

      return prediction;
    } catch {
      throw new ConflictException('Prediction already exists for this match');
    }
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
