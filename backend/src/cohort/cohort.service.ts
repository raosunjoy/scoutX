import { Injectable, NotFoundException } from '@nestjs/common';
   import { InjectModel } from '@nestjs/mongoose';
   import { Model } from 'mongoose';
   import { Cohort } from './cohort.schema';
   import { Redis } from 'ioredis';
   import * as tf from '@tensorflow/tfjs';

   @Injectable()
   export class CohortService {
     private redis: Redis;

     constructor(
       @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
     ) {
       this.redis = new Redis({ host: 'localhost', port: 6379 });
     }

     async fetchCohortData(cohortId: string) {
       const cachedData = await this.redis.get(`cohort:${cohortId}`);
       if (cachedData) {
         return JSON.parse(cachedData);
       }

       const cohort = await this.cohortModel.findOne({ cohortId }).exec();
       if (!cohort) {
         throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
       }

       const successScore = this.calculateSuccessScore(cohort);
       cohort.successScore = successScore;

       cohort.highlights = await Promise.all(
         cohort.highlights.map(async (highlight: { uri: string; data?: string }) => {
           return { uri: highlight.uri, data: highlight.data || 'Mock data' };
         }),
       );

       await this.redis.set(
         `cohort:${cohortId}`,
         JSON.stringify(cohort),
         'EX',
         3600,
       );

       return cohort;
     }

     private calculateSuccessScore(cohort: Cohort): number {
       const model = tf.sequential();
       model.add(tf.layers.dense({ units: 1, inputShape: [Object.keys(cohort.stats).length] }));
       model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

       const statsArray = Object.values(cohort.stats);
       const xs = tf.tensor2d([statsArray], [1, statsArray.length]);
       const prediction = model.predict(xs) as tf.Tensor;
       const score = prediction.dataSync()[0];
       return Math.min(Math.max(score, 0), 1);
     }
   }