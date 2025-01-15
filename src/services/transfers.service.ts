import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Block, ethers, Log } from 'ethers';
import { DatabaseService } from './database.service';

@Injectable()
export class TransfersService {

  constructor(private configService: ConfigService, private dbService: DatabaseService) {}

  private readonly url: string ='https://eth-mainnet.g.alchemy.com/v2/' + this.configService.get<string>('ALCHEMY_API_KEY');
  private provider = new ethers.JsonRpcProvider(this.url);

  async fetchTransferLogs(): Promise<void> {
      try {
        const latestBlock = await this.provider.getBlockNumber();
        let startBlockHex = await this.dbService.getLastProcessedBlock();
        if(startBlockHex === 0) {
          startBlockHex = await this.getFirstBlock()
        }
        const startBlock = Number(startBlockHex.toString());
        const event = ethers.id('Transfer(address,address,uint256)');
        const batchSize = 100;
  
        for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += batchSize) {
          const toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
  
          console.log(`\nProcessing blocks ${fromBlock} to ${toBlock}...`);
  
          const logs = await this.provider.getLogs({
            fromBlock,
            toBlock,
            topics: [event],
          });

          const processedLogs = this.processLogs(logs);
          await this.dbService.storeLogs(processedLogs);
          
          console.log(`Processed blocks ${fromBlock} to ${toBlock}`);
        }
      } catch (err) {
        console.error('Error fetching historical logs and storing them:', err);
        throw err;
      }
  }

  processLogs(logs: Array<Log>): Array<any> {
    return logs
    .filter((log) => log.topics.length === 3)
    .map((log) => {
      return {
        transactionHash: ethers.stripZerosLeft(log.transactionHash),
        blockNumber: log.blockNumber,
        tokenAddress: log.address,
        fromAddress: log.topics[1] ? ethers.stripZerosLeft(log.topics[1]) : null,
        toAddress: log.topics[2] ? ethers.stripZerosLeft(log.topics[2]) : null,
        amount: ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], log.data).toString()
      }
    });
  }

  //binary search function that gets the first block number created 3 months ago
  async getFirstBlock(): Promise<number> {
    try {
      const threeMonthsInSecs: number = 7776000;

      let left = 0;
      let right = await this.provider.getBlockNumber(); //latest block number
      const targetTimestamp =
        (await this.getBlockTimestampByNumber(right)) - threeMonthsInSecs; //timestamp of 3 months ago

      let targetBlock: Block;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        targetBlock = await this.provider.send('eth_getBlockByNumber', [
          '0x' + mid.toString(16),
          false,
        ]);
        const midTimestamp = targetBlock.timestamp;

        if (midTimestamp === targetTimestamp) {
          return targetBlock.number;
        }

        if (midTimestamp < targetTimestamp) {
          left = mid + 1;
        } else right = mid - 1;
      }
      return targetBlock.number;
    } catch (err) {
      throw err;
    }
  }

  async getBlockTimestampByNumber(blockNum: number): Promise<number> {
    return await this.provider
      .send('eth_getBlockByNumber', ['0x' + blockNum.toString(16), false])
      .then((block) => {
        return block.timestamp;
      })
      .catch((err) => {
        console.error('ERROR: ', err);
        throw err;
      });
  }
}
