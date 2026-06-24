import {
  Controller,
  ParseIntPipe,
  UseGuards,
  Get,
  Body,
  Post,
  Param,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PredictionsService } from './predictions.service';
import { match } from 'assert';
import { CreatePredictionDto } from './create-prediction.dto';

@Controller('matches/:matchId/predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly PredictionSerice: PredictionsService) {}

  @Get('me')
  findMine(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.PredictionSerice.findMine(matchId, req.user.id);
  }

  @Post()
  create(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Req() req: { user: { id: number } },
    @Body() dto: CreatePredictionDto,
  ) {
    return this.PredictionSerice.create(matchId, req.user.id, dto);
  }
}
