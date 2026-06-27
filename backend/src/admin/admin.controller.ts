import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CreateFixtureDto } from './create-fixture.dto';
import { CreateParticipantDto } from './create-participant.dto';
import { UpdateFixtureResultDto } from './update-fixture-result.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('fixtures')
  listFixtures() {
    return this.adminService.listFixtures();
  }

  @Post('fixtures')
  createFixture(@Body() dto: CreateFixtureDto) {
    return this.adminService.createFixture(dto);
  }

  @Patch('fixtures/:matchId/result')
  updateResult(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() dto: UpdateFixtureResultDto,
  ) {
    return this.adminService.updateResult(matchId, dto);
  }

  @Patch('fixtures/:matchId/reopen')
  reopenFixture(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminService.reopenFixture(matchId);
  }

  @Delete('fixtures/:matchId')
  deleteFixture(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminService.deleteFixture(matchId);
  }

  @Get('participants')
  listParticipants() {
    return this.adminService.listParticipants();
  }

  @Post('participants')
  createParticipant(@Body() dto: CreateParticipantDto) {
    return this.adminService.createParticipant(dto);
  }

  @Delete('participants/:userId')
  deleteParticipant(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.deleteParticipant(userId);
  }

  @Get('predictions')
  listPredictions() {
    return this.adminService.listPredictions();
  }

  @Get('top-scorer-picks')
  listTopScorerPicks() {
    return this.adminService.listTopScorerPicks();
  }

  @Get('export/standings.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="standings.csv"')
  exportStandings() {
    return this.adminService.exportStandingsCsv();
  }

  @Get('export/pins.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="pins.csv"')
  exportPins() {
    return this.adminService.exportPinsCsv();
  }

  @Post('recalculate')
  recalculate() {
    return this.adminService.recalculatePoints();
  }
}
