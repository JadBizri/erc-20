import { IsString, IsOptional, IsInt } from 'class-validator';

export class TransferLogDto {
  @IsString()
  transactionHash: string;

  @IsInt()
  blockNumber: number;

  @IsString()
  tokenAddress: string;

  @IsString()
  @IsOptional()
  fromAddress?: string;

  @IsString()
  @IsOptional()
  toAddress?: string;

  @IsString()
  @IsOptional()
  amount: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;
}
