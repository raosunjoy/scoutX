import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { MintController } from './mint.controller';
import { MintService } from './mint.service';
import { Cohort, CohortSchema } from '../cohort/cohort.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Cohort', schema: CohortSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [MintController],
  providers: [MintService],
})
export class MintModule {}