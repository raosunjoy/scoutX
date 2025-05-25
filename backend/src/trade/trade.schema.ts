import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Trade extends Document {
  @Prop({ required: true })
  userWallet: string;

  @Prop({ required: true })
  cohortId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  type: string; // 'buy' or 'sell'

  @Prop({ required: true })
  fee: number;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  transactionId: string;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);