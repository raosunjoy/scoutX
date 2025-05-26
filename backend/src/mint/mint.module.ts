import { Module } from '@nestjs/common';
  import { JwtModule } from '@nestjs/jwt';
  import { MintController } from './mint.controller';
  import { MintService } from './mint.service';
  import { DatabaseModule } from '../database/database.module';

  @Module({
    imports: [
      DatabaseModule,
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'scoutx-secret',
        signOptions: { expiresIn: '1h' },
      }),
    ],
    controllers: [MintController],
    providers: [MintService],
  })
  export class MintModule {}