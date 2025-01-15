import { Injectable, OnModuleInit } from '@nestjs/common';
import { TransfersService } from './transfers.service';

@Injectable()
export class AppService implements OnModuleInit {

  constructor(private tService: TransfersService) {}

  onModuleInit() {
    this.tService.fetchTransferLogs();
  }
}