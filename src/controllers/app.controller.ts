import { Controller, Get, Param } from '@nestjs/common';
import { BalanceService } from '../core/services/balance.service';

@Controller()
export class AppController {
  constructor(private readonly balanceService: BalanceService) {}

  //TODO: ENSURE wallet address
  @Get('logs/:walletAddress')
  getLogs(@Param('walletAddress') walletAddress: string) {
    return this.balanceService.tokenBalances(walletAddress);
  }
}
