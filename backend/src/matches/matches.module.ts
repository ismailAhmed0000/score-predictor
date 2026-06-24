import { Module } from '@nestjs/common';
import { MatchController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  controllers: [MatchController],
  providers: [MatchesService],
})
export class MatchModule {}
