import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchesService } from './matches.service';
import { SetMatchResultDto } from './set-match-result.dto';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchController {
  constructor(private readonly matchService: MatchesService) {}

  @Get()
  findAll() {
    return this.matchService.findAll();
  }

  @Patch(':matchId/result')
  setResult(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() dto: SetMatchResultDto,
  ) {
    return this.matchService.setResult(matchId, dto);
  }
}
