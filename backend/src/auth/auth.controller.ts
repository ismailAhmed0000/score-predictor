import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './login.dto';
import { SetTournamentTopScorerDto } from './set-tournament-top-scorer.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me/tournament-top-scorer')
  @UseGuards(JwtAuthGuard)
  getTournamentTopScorer(@Req() req: { user: { id: number } }) {
    return this.authService.getTournamentTopScorer(req.user.id);
  }

  @Put('me/tournament-top-scorer')
  @UseGuards(JwtAuthGuard)
  setTournamentTopScorer(
    @Req() req: { user: { id: number } },
    @Body() dto: SetTournamentTopScorerDto,
  ) {
    return this.authService.setTournamentTopScorer(
      req.user.id,
      dto.tournamentTopScorer,
    );
  }
}
