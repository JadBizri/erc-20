import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from '../services/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('latest-block')
  getLatestBlock() {
    return this.appService.getTheLatestBlock();
  }

  @Get('first-block')
  getFirstBlock() {
    return this.appService.getFirstBlock();
  }

  @Post('erc-transfers')
  getErcTransfers() {
    return this.appService.getErcTransfers();
  }

  @Post('store-tokens')
  storeTokens() {
    return this.appService.storeTokens();
  }
}
