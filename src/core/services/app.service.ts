import { Injectable, OnModuleInit } from '@nestjs/common';
import { TransfersService } from '../../external/ethers/transfers.service';
import { DatabaseService } from '../../external/db/database.service';

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

    this.fetchTransfersInBatches(latestBlock, startBlock, batch);
    
  }

  async fetchTransfersInBatches(latestBlock: number, startBlock: number, batch: number) {
    for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += batch) {
      const toBlock = Math.min(fromBlock + batch - 1, latestBlock);

      console.log(`\nProcessing blocks ${fromBlock} to ${toBlock}...`);

      const allLogs = await this.tService.fetchTransferLogs(fromBlock, toBlock);

      const logs = allLogs
      .filter((log) => !log.errorMessage)
      .map((log) => log)
      
      await Promise.all(
        allLogs.map(async (log) => {
          if (log.errorMessage) {
            await this.dbService.storeFailedLog(log);
          }
        })
      );

      const tokenAddresses = Array.from(
        new Set(logs.map((log) => log.tokenAddress))
      );
      const batchSize = 5;
      const tokenMetadata = await this.getTokenMetadataInBatches(tokenAddresses, batchSize);

      await this.dbService.storeTokenData(tokenMetadata);

      await this.dbService.storeLogs(logs);

      console.log(`Processed blocks ${fromBlock} to ${toBlock}`);
    }
  }

  async getTokenMetadataInBatches(addresses: string[], batchSize: number): Promise<any[]> {
    const results: any[] = [];
  
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
  
      const batchResults = await Promise.all(
        batch.map(async (address) => {
          try {
            const metadata = await this.tService.getTokenMetadata(address);
            return metadata;
          } catch (error) {
            console.error(`Failed to fetch metadata for address: ${address}`, error);
            return null;
          }
        })
      );
  
      results.push(...batchResults);
    }
  
    return results.filter((result) => result !== null);
  }
}
