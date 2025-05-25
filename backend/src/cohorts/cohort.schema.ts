import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PerformanceEntry {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  academy: string;

  @Prop({ required: true })
  stats: Record<string, number>;

  @Prop({ required: true })
  successScore: number;
}

@Schema()
export class Player {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  stats: Record<string, number>;

  @Prop({ required: true })
  matchesPlayed: number;

  @Prop({ required: true })
  successScore: number;

  @Prop({ type: [PerformanceEntry], default: [] })
  performanceHistory: PerformanceEntry[];
}

@Schema()
export class Cohort extends Document {
  @Prop({ required: true, unique: true })
  cohortId: string;

  @Prop({ required: true })
  sport: string;

  @Prop({ required: true })
  stats: Record<string, number>;

  @Prop({ type: [{ uri: String, data: String }], default: [] })
  highlights: { uri: string; data?: string }[];

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ type: String })
  tokenAddress: string;

  @Prop({ type: [Player], default: [] })
  players: Player[];
}

export const CohortSchema = SchemaFactory.createForClass(Cohort);