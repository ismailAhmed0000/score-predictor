import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePredictionDto } from './create-prediction.dto';
import { PredictionsService } from './predictions.service';

@Controller('matches/:matchId/predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('me')
  findMine(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.predictionsService.findMine(matchId, req.user.id);
  }

  @Post()
  create(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Req() req: { user: { id: number } },
    @Body() dto: CreatePredictionDto,
  ) {
    return this.predictionsService.create(matchId, req.user.id, dto);
  }

  @Put()
  update(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Req() req: { user: { id: number } },
    @Body() dto: CreatePredictionDto,
  ) {
    return this.predictionsService.update(matchId, req.user.id, dto);
  }
}
