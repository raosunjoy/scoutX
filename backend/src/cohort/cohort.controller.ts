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
    return this.cohortService.fetchCohortData(cohortId);
  }

  @Get('players/:cohortId')
  async getPlayers(@Param('cohortId') cohortId: string) {
    return this.playerService.getPlayersByCohort(cohortId);
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
  async getPerformanceTrends(
    @Param('cohortId') cohortId: string,
    @Param('playerName') playerName: string,
  ) {
    return this.playerService.getPerformanceTrends(cohortId, playerName);
  }

  @Get('academy-rankings/:cohortId')
  async getAcademyRankings(@Param('cohortId') cohortId: string) {
    return this.playerService.getAcademyRankings(cohortId);
  }

  @Get('swot/:cohortId/:playerName')
  async getSWOT(
    @Param('cohortId') cohortId: string,
    @Param('playerName') playerName: string,
  ) {
    const comparison = await this.playerService.comparePlayers(cohortId, playerName, playerName);
    return comparison.swot[playerName];
  }
}