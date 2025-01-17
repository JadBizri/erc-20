import { Injectable, OnModuleInit } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { DatabaseService } from './database.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private tService: TransfersService,
    private dbService: DatabaseService,
  ) {}

  async onModuleInit() {
    //start fetching and storing
    const batch = 100;

    const latestBlock = await this.tService.getLatestBlockNumber();
    let startBlockHex = await this.dbService.getLastProcessedBlock();
    if (startBlockHex === 0) {
      startBlockHex = await this.tService.getFirstBlock();
    }
    const startBlock = Number(startBlockHex.toString());

    for (
      let fromBlock = startBlock;
      fromBlock <= latestBlock;
      fromBlock += batch
    ) {
      const toBlock = Math.min(fromBlock + batch - 1, latestBlock);

      console.log(`\nProcessing blocks ${fromBlock} to ${toBlock}...`);

      const logs = await this.tService.fetchTransferLogs(fromBlock, toBlock);

      await this.dbService.storeLogs(logs);

      console.log(`Processed blocks ${fromBlock} to ${toBlock}`);
    }
  }
}
