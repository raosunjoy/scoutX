import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from './cohort.schema';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
  ) {}

  async getPlayersByCohort(cohortId: string) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const players = [
      { name: 'John Smith', stats: { battingAverage: 30.5, strikeRate: 85.2 }, successScore: 0.75 },
      { name: 'Mike Jones', stats: { battingAverage: 28.9, strikeRate: 82.1 }, successScore: 0.72 },
    ];

    return players;
  }

  async comparePlayers(cohortId: string, player1: string, player2: string) {
    const players = await this.getPlayersByCohort(cohortId);
    const p1 = players.find((p) => p.name === player1);
    const p2 = players.find((p) => p.name === player2);

    if (!p1 || !p2) {
      throw new Error('One or both players not found');
    }

    const statsComparison: Record<string, { playerStats: Record<string, number>; difference: string }> = {};
    for (const stat in p1.stats) {
      const diff = (p1.stats[stat] - p2.stats[stat]).toFixed(2);
      statsComparison[stat] = {
        playerStats: {
          [p1.name]: p1.stats[stat],
          [p2.name]: p2.stats[stat],
        },
        difference: `${diff}%`,
      };
    }

    const successScoreDiff = ((p1.successScore - p2.successScore) * 100).toFixed(2);
    const successScoreComparison = {
      playerStats: {
        [p1.name]: (p1.successScore * 100).toFixed(2),
        [p2.name]: (p2.successScore * 100).toFixed(2),
      },
      difference: `${successScoreDiff}%`,
    };

    const swot = {
      [p1.name]: {
        strengths: ['High batting average'],
        weaknesses: ['Lower strike rate'],
        opportunities: ['Improve consistency'],
        threats: ['Injury risk'],
      },
      [p2.name]: {
        strengths: ['Consistent performance'],
        weaknesses: ['Lower batting average'],
        opportunities: ['Increase strike rate'],
        threats: ['Competition from peers'],
      },
    };

    return { stats: statsComparison, successScore: successScoreComparison, swot };
  }

  async getPerformanceTrends(cohortId: string, playerName: string) {
    const players = await this.getPlayersByCohort(cohortId);
    const player = players.find((p) => p.name === playerName);

    if (!player) {
      throw new Error('Player not found');
    }

    const trends = {
      academyA: {
        timestamps: ['2025-01-01', '2025-02-01', '2025-03-01'],
        stats: {
          battingAverage: [30.5, 31.2, 32.0],
          strikeRate: [85.2, 86.0, 87.5],
        },
        successScores: [75, 76, 78],
      },
      academyB: {
        timestamps: ['2025-01-01', '2025-02-01', '2025-03-01'],
        stats: {
          battingAverage: [28.9, 29.5, 30.0],
          strikeRate: [82.1, 83.0, 84.0],
        },
        successScores: [72, 73, 74],
      },
    };

    return trends;
  }

  async calculateStatsVariance(cohortId: string, playerName: string, stat: string) {
    const trends = await this.getPerformanceTrends(cohortId, playerName);
    const statValues: number[] = Object.values(trends)
      .flatMap((academy: any) => academy.stats[stat] || []);

    if (statValues.length === 0) {
      return { average: 0, variance: 0, standardDeviation: 0 };
    }

    const avgStat = statValues.reduce((sum: number, val: number) => sum + val, 0) / statValues.length;
    const variance = statValues.reduce((sum: number, val: number) => sum + Math.pow(val - avgStat, 2), 0) / statValues.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      average: avgStat,
      variance,
      standardDeviation,
    };
  }

  async getAcademyRankings(cohortId: string) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const players = await this.getPlayersByCohort(cohortId);
    const academies: Record<string, { stats: Record<string, number[]>; successScores: number[] }> = {
      academyA: { stats: { battingAverage: [], strikeRate: [] }, successScores: [] },
      academyB: { stats: { battingAverage: [], strikeRate: [] }, successScores: [] },
    };

    players.forEach((player, index) => {
      const academy = index % 2 === 0 ? 'academyA' : 'academyB';
      academies[academy].stats.battingAverage.push(player.stats.battingAverage);
      academies[academy].stats.strikeRate.push(player.stats.strikeRate);
      academies[academy].successScores.push(player.successScore * 100);
    });

    const rankings: { academy: string; avgStats: Record<string, number>; avgSuccessScore: number; compositeScore: number }[] = [];
    for (const academy in academies) {
      const avgStats: Record<string, number> = {};
      for (const stat in academies[academy].stats) {
        const values = academies[academy].stats[stat];
        avgStats[stat] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      }
      const avgSuccessScore = academies[academy].successScores.reduce((sum: number, val: number) => sum + val, 0) / academies[academy].successScores.length;
      const compositeScore = (avgStats.battingAverage * 0.4 + avgStats.strikeRate * 0.3 + avgSuccessScore * 0.3);

      rankings.push({
        academy,
        avgStats,
        avgSuccessScore,
        compositeScore,
      });
    }

    rankings.sort((a, b) => b.compositeScore - a.compositeScore);
    return rankings;
  }
}