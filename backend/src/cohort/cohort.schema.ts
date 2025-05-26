import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Cohort extends Document {
  @Prop({ required: true })
  cohortId: string;

  @Prop({ required: true })
  sport: string;

  @Prop({ type: Object })
  stats: Record<string, number>;

  @Prop()
  successScore: number;

  @Prop({ type: [{ uri: String, data: String }], default: [] })
  highlights: Array<{ uri: string; data?: string }>;

  @Prop({ type: [String], default: [] })
  tradeHistory: string[];
}

export const CohortSchema = SchemaFactory.createForClass(Cohort);

