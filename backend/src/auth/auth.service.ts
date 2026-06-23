import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
    });

    return { accessToken, user: { id: user.id, name: user.name } };
  }
}
