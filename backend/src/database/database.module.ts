import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cohort, CohortSchema } from '../cohort/cohort.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cohort.name, schema: CohortSchema }]),
  ],
  exports: [
    MongooseModule.forFeature([{ name: Cohort.name, schema: CohortSchema }]),
  ],
})
export class DatabaseModule {}