import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('block')
  getLatestBlock() {
    return this.appService.getBlock();
  }

  @Get('first-block')
  getBlockByNum() {
    return this.appService.getFirstBlock();
  }
}
