import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from 'src/db/database.module';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { LoginDto } from './login.dto';
import * as bcrypt from 'bcrypt';
import { users } from '../db/schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly dbb: typeof db,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const [user] = await this.dbb
      .select()
      .from(users)
      .where(eq(users.name, dto.name));

    if (!user) {
      throw new UnauthorizedException('Invalid name or PIN');
    }

    const valid = await bcrypt.compare(dto.pin, user.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid name or PIN');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    return {
      accessToken,
      user: { id: user.id, name: user.name, isAdmin: user.isAdmin },
    };
  }

  async getTournamentTopScorer(userId: number) {
    const [user] = await this.dbb
      .select({ tournamentTopScorer: users.tournamentTopScorer })
      .from(users)
      .where(eq(users.id, userId));

    return { tournamentTopScorer: user?.tournamentTopScorer ?? null };
  }

  async setTournamentTopScorer(userId: number, tournamentTopScorer: string) {
    const trimmed = tournamentTopScorer.trim();
    if (!trimmed) {
      throw new BadRequestException('Top scorer name is required');
    }

    const [user] = await this.dbb
      .update(users)
      .set({ tournamentTopScorer: trimmed })
      .where(eq(users.id, userId))
      .returning({ tournamentTopScorer: users.tournamentTopScorer });

    return { tournamentTopScorer: user.tournamentTopScorer };
  }
}
