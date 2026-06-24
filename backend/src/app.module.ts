import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './auth/auth.module';
import { MatchesModule } from './matches/matches.module';
import { PredictionsModule } from './predictions/predictions.module';

@Module({
  imports: [DatabaseModule, AuthModule, MatchesModule, PredictionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
