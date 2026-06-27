import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { alias } from 'drizzle-orm/pg-core';
import { eq, sql, asc } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import { db } from '../db';
import { matchPredictions, matches, teams, users } from '../db/schema';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { CreateFixtureDto } from './create-fixture.dto';
import { CreateParticipantDto } from './create-participant.dto';
import { UpdateFixtureResultDto } from './update-fixture-result.dto';

const homeTeam = alias(teams, 'home_team');
const awayTeam = alias(teams, 'away_team');

@Injectable()
export class AdminService {
  constructor(
    @Inject(DRIZZLE) private readonly dbb: typeof db,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  private async findOrCreateTeam(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Team name is required');
    }

    const [existing] = await this.dbb
      .select()
      .from(teams)
      .where(eq(teams.name, trimmed));

    if (existing) {
      return existing;
    }

    const [created] = await this.dbb
      .insert(teams)
      .values({ name: trimmed })
      .returning();

    return created;
  }

  listFixtures() {
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
        predictionCount: sql<number>`cast(count(${matchPredictions.id}) as int)`,
      })
      .from(matches)
      .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
      .leftJoin(matchPredictions, eq(matchPredictions.matchId, matches.id))
      .groupBy(
        matches.id,
        homeTeam.name,
        awayTeam.name,
        matches.kickoffAt,
        matches.homeScore,
        matches.awayScore,
        matches.topScorerName,
        matches.topScorerGoals,
        matches.status,
      )
      .orderBy(asc(matches.kickoffAt));
  }

  async createFixture(dto: CreateFixtureDto) {
    const home = await this.findOrCreateTeam(dto.homeTeam);
    const away = await this.findOrCreateTeam(dto.awayTeam);

    if (home.id === away.id) {
      throw new BadRequestException('Home and away teams must be different');
    }

    const kickoffAt = new Date(dto.kickoffAt);
    if (Number.isNaN(kickoffAt.getTime())) {
      throw new BadRequestException('Invalid kickoff date');
    }

    const [created] = await this.dbb
      .insert(matches)
      .values({
        homeTeamId: home.id,
        awayTeamId: away.id,
        kickoffAt,
        status: 'scheduled',
      })
      .returning();

    const listed = await this.listFixtures();
    return (
      listed.find((m) => m.id === created.id) ?? {
        id: created.id,
        kickoffAt: created.kickoffAt,
        homeScore: created.homeScore,
        awayScore: created.awayScore,
        topScorerName: created.topScorerName,
        topScorerGoals: created.topScorerGoals,
        status: created.status,
        homeTeam: home.name,
        awayTeam: away.name,
        predictionCount: 0,
      }
    );
  }

  async updateResult(matchId: number, dto: UpdateFixtureResultDto) {
    const [match] = await this.dbb
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const topScorerName =
      dto.topScorerName?.trim() || match.topScorerName || 'Unknown';
    const topScorerGoals =
      dto.topScorerGoals ?? match.topScorerGoals ?? 0;

    const [updated] = await this.dbb
      .update(matches)
      .set({
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
        topScorerName,
        topScorerGoals,
        status: 'finished',
      })
      .where(eq(matches.id, matchId))
      .returning();

    const listed = await this.listFixtures();
    return listed.find((m) => m.id === updated.id) ?? updated;
  }

  async reopenFixture(matchId: number) {
    const [match] = await this.dbb
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.dbb
      .update(matches)
      .set({
        homeScore: null,
        awayScore: null,
        topScorerName: null,
        topScorerGoals: null,
        status: 'scheduled',
      })
      .where(eq(matches.id, matchId));

    const listed = await this.listFixtures();
    return listed.find((m) => m.id === matchId);
  }

  async deleteFixture(matchId: number) {
    const [match] = await this.dbb
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.dbb
      .delete(matchPredictions)
      .where(eq(matchPredictions.matchId, matchId));
    await this.dbb.delete(matches).where(eq(matches.id, matchId));

    return { deleted: true };
  }

  listParticipants() {
    return this.dbb
      .select({
        id: users.id,
        name: users.name,
        isAdmin: users.isAdmin,
        tournamentTopScorer: users.tournamentTopScorer,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isAdmin, false))
      .orderBy(users.name);
  }

  async createParticipant(dto: CreateParticipantDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const pin = dto.pin?.trim() || String(Math.floor(1000 + Math.random() * 9000));
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN must be 4 digits');
    }

    try {
      const [user] = await this.dbb
        .insert(users)
        .values({
          name,
          pinHash: await bcrypt.hash(pin, 10),
          lastIssuedPin: pin,
          isAdmin: false,
        })
        .returning({
          id: users.id,
          name: users.name,
          isAdmin: users.isAdmin,
          tournamentTopScorer: users.tournamentTopScorer,
          createdAt: users.createdAt,
        });

      return { user, pin };
    } catch {
      throw new BadRequestException('Participant already exists');
    }
  }

  async deleteParticipant(userId: number) {
    const [user] = await this.dbb
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new NotFoundException('Participant not found');
    }

    if (user.isAdmin) {
      throw new BadRequestException('Cannot delete an admin user');
    }

    await this.dbb
      .delete(matchPredictions)
      .where(eq(matchPredictions.userId, userId));
    await this.dbb.delete(users).where(eq(users.id, userId));

    return { deleted: true };
  }

  listPredictions() {
    return this.dbb
      .select({
        id: matchPredictions.id,
        userId: matchPredictions.userId,
        userName: users.name,
        matchId: matchPredictions.matchId,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        kickoffAt: matches.kickoffAt,
        matchStatus: matches.status,
        predictedHomeScore: matchPredictions.predictedHomeScore,
        predictedAwayScore: matchPredictions.predictedAwayScore,
        updatedAt: matchPredictions.updatedAt,
      })
      .from(matchPredictions)
      .innerJoin(users, eq(matchPredictions.userId, users.id))
      .innerJoin(matches, eq(matchPredictions.matchId, matches.id))
      .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
      .orderBy(matches.kickoffAt, users.name);
  }

  listTopScorerPicks() {
    return this.dbb
      .select({
        id: users.id,
        name: users.name,
        tournamentTopScorer: users.tournamentTopScorer,
      })
      .from(users)
      .where(eq(users.isAdmin, false))
      .orderBy(users.name);
  }

  async exportStandingsCsv() {
    const entries = await this.leaderboardService.getLeaderboard();
    const header = 'Rank,Name,Match,Scorer,Total';
    const rows = entries.map((entry, index) => {
      const matchPts = entry.exactScorePoints + entry.outcomePoints;
      const scorerPts = entry.topScorerPoints + entry.goalBonusPoints;
      return [
        index + 1,
        csvEscape(entry.name),
        matchPts,
        scorerPts,
        entry.total,
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  async exportPinsCsv() {
    const participants = await this.dbb
      .select({
        name: users.name,
        pin: users.lastIssuedPin,
      })
      .from(users)
      .where(eq(users.isAdmin, false))
      .orderBy(users.name);

    const header = 'Name,PIN';
    const rows = participants.map((p) =>
      [csvEscape(p.name), csvEscape(p.pin ?? '—')].join(','),
    );
    return [header, ...rows].join('\n');
  }

  recalculatePoints() {
    return this.leaderboardService.getLeaderboard();
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
