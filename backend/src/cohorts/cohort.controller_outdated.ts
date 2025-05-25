import { Controller, Get, Param, Query } from '@nestjs/common';
import { CohortService } from './cohort.service';
import { PlayerService } from './player.service';

@Controller('cohort')
export class CohortController {
  constructor(
    private readonly cohortService: CohortService,
    private readonly playerService: PlayerService,
  ) {}

  @Get('data/:cohortId')
  async getCohortData(@Param('cohortId') cohortId: string) {
    return this.cohortService.getCohortData(cohortId);
  }

  @Get('players/:cohortId')
  async getPlayers(@Param('cohortId') cohortId: string) {
    return this.playerService.getPlayers(cohortId);
  }

  @Get('swot/:cohortId/:playerName')
  async getPlayerSWOT(@Param('cohortId') cohortId: string, @Param('playerName') playerName: string) {
    return this.playerService.generateSWOT(cohortId, playerName);
  }

  @Get('compare-players/:cohortId')
  async comparePlayers(
    @Param('cohortId') cohortId: string,
    @Query('player1') player1: string,
    @Query('player2') player2: string,
  ) {
    return this.playerService.comparePlayers(cohortId, player1, player2);
  }

  @Get('performance-trends/:cohortId/:playerName')
  async getPerformanceTrends(@Param('cohortId') cohortId: string, @Param('playerName') playerName: string) {
    return this.playerService.getPerformanceTrends(cohortId, playerName);
  }
}