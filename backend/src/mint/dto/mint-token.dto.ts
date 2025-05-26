import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class MintTokenDto {
  @IsString()
  @IsNotEmpty()
  userWallet: string;

  @IsString()
  @IsNotEmpty()
  cohortId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}