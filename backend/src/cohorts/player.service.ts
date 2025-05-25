import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';

@Injectable()
export class PlayerService {
  constructor(@InjectModel('Cohort') private cohortModel: Model<Cohort>) {}

  async getPlayers(cohortId: string) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }
    return cohort.players;
  }

  async generateSWOT(cohortId: string, playerName: string) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const player = cohort.players.find((p) => p.name === playerName);
    if (!player) {
      throw new Error('Player not found');
    }

    const { sport, stats: playerStats, matchesPlayed, successScore } = player;

    const statThresholds = {
      cricket: { battingAverage: 40 },
      football: { passingAccuracy: 80 },
      basketball: { shootingAccuracy: 45, threePointPercentage: 35 },
    };

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    for (const [stat, value] of Object.entries(playerStats)) {
      const threshold = statThresholds[sport]?.[stat];
      if (threshold && value >= threshold) {
        strengths.push(`${stat}: ${value} (Above average)`);
      } else if (threshold) {
        weaknesses.push(`${stat}: ${value} (Below average, needs improvement)`);
      }
    }

    if (successScore > 0.8) {
      opportunities.push('High potential for growth (Success Score: ' + (successScore * 100).toFixed(2) + '%)');
    } else if (successScore > 0.5) {
      opportunities.push('Moderate potential for growth (Success Score: ' + (successScore * 100).toFixed(2) + '%)');
    }

    if (matchesPlayed < 10) {
      threats.push('Low playtime (Matches Played: ' + matchesPlayed + ')');
    }
    const statValues = Object.values(playerStats);
    const avgStat = statValues.reduce((sum, val) => sum + val, 0) / statValues.length;
    const variance = statValues.reduce((sum, val) => sum + Math.pow(val - avgStat, 2), 0) / statValues.length;
    if (variance > 100) {
      threats.push('Inconsistent performance (High variance in stats)');
    }

    return { strengths, weaknesses, opportunities, threats };
  }

  async comparePlayers(cohortId: string, player1Name: string, player2Name: string) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const player1 = cohort.players.find((p) => p.name === player1Name);
    const player2 = cohort.players.find((p) => p.name === player2Name);

    if (!player1 || !player2) {
      throw new Error('One or both players not found');
    }

    const statComparison = {};
    const player1Stats = player1.stats;
    const player2Stats = player2.stats;

    for (const stat in player1Stats) {
      if (player2Stats.hasOwnProperty(stat)) {
        const value1 = player1Stats[stat];
        const value2 = player2Stats[stat];
        const diff = value1 - value2;
        const percentDiff = value2 !== 0 ? ((diff / value2) * 100).toFixed(2) : 'N/A';
        statComparison[stat] = {
          [player1Name]: value1,
          [player2Name]: value2,
          difference: `${diff >= 0 ? '+' : ''}${diff} (${percentDiff}% ${diff >= 0 ? 'higher' : 'lower'})`,
        };
      }
    }

    const successScoreComparison = {
      [player1Name]: (player1.successScore * 100).toFixed(2) + '%',
      [player2Name]: (player2.successScore * 100).toFixed(2) + '%',
      difference: player1.successScore > player2.successScore
        ? `${player1Name} is ${(player1.successScore - player2.successScore) * 100}% higher`
        : `${player2Name} is ${(player2.successScore - player1.successScore) * 100}% higher`,
    };

    const swot1 = await this.generateSWOT(cohortId, player1Name);
    const swot2 = await this.generateSWOT(cohortId, player2Name);

    return {
      stats: statComparison,
      successScore: successScoreComparison,
      swot: {
        [player1Name]: swot1,
        [player2Name]: swot2,
      },
    };
  }

  async getPerformanceTrends(cohortId: string, playerName: string) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const player = cohort.players.find((p) => p.name === playerName);
    if (!player) {
      throw new Error('Player not found');
    }

    const performanceHistory = player.performanceHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const trendsByAcademy: { [academy: string]: { timestamps: string[], stats: { [stat: string]: number[] }, successScores: number[] } } = {};
    performanceHistory.forEach((entry) => {
      const { academy, timestamp, stats, successScore } = entry;
      if (!trendsByAcademy[academy]) {
        trendsByAcademy[academy] = { timestamps: [], stats: {}, successScores: [] };
        for (const stat in stats) {
          trendsByAcademy[academy].stats[stat] = [];
        }
      }
      trendsByAcademy[academy].timestamps.push(new Date(timestamp).toLocaleDateString());
      for (const stat in stats) {
        trendsByAcademy[academy].stats[stat].push(stats[stat]);
      }
      trendsByAcademy[academy].successScores.push(successScore * 100);
    });

    return trendsByAcademy;
  }

  async getAcademyRankings(cohortId: string) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    // Aggregate performance data by academy
    const academyStats: { [academy: string]: { stats: { [stat: string]: number[] }, successScores: number[], playerCount: number } } = {};

    cohort.players.forEach((player) => {
      player.performanceHistory.forEach((entry) => {
        const { academy, stats, successScore } = entry;
        if (!academyStats[academy]) {
          academyStats[academy] = { stats: {}, successScores: [], playerCount: 0 };
        }

        // Aggregate stats
        for (const stat in stats) {
          if (!academyStats[academy].stats[stat]) {
            academyStats[academy].stats[stat] = [];
          }
          academyStats[academy].stats[stat].push(stats[stat]);
        }

        academyStats[academy].successScores.push(successScore * 100);
        academyStats[academy].playerCount++;
      });
    });

    // Calculate averages and rank
    const rankings = Object.entries(academyStats).map(([academy, data]) => {
      const avgStats: { [stat: string]: number } = {};
      for (const stat in data.stats) {
        const values = data.stats[stat];
        avgStats[stat] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
      const avgSuccessScore = data.successScores.reduce((sum, val) => sum + val, 0) / data.successScores.length;

      // Composite score: 60% stats + 40% Success Score
      const statScore = Object.values(avgStats).reduce((sum, val) => sum + val, 0) / (Object.keys(avgStats).length || 1);
      const compositeScore = 0.6 * statScore + 0.4 * avgSuccessScore;

      return {
        academy,
        avgStats,
        avgSuccessScore: avgSuccessScore.toFixed(2),
        compositeScore: compositeScore.toFixed(2),
        playerCount: data.playerCount,
      };
    });

    // Sort by composite score (descending)
    rankings.sort((a, b) => b.compositeScore - a.compositeScore);

    return rankings;
  }
}