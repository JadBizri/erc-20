import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Block, ethers, Log } from 'ethers';

@Injectable()
export class AppService implements OnModuleInit {
  onModuleInit() {
    this.fetchErc20Transfers();
  }

  private readonly alchemyApiKey: string =
    this.configService.get<string>('ALCHEMY_API_KEY');
  private readonly url: string =
    'https://eth-mainnet.g.alchemy.com/v2/' + this.alchemyApiKey;
  private readonly threeMonthsInSecs: number = 7776000;
  private prisma = new PrismaClient();
  private provider = new ethers.JsonRpcProvider(this.url);

  constructor(private configService: ConfigService) {}

  async getBlock(): Promise<Block> {
    return await this.provider.send('eth_getBlockByNumber', [
      '0x13f447e',
      false,
    ]);
  }

  async fetchErc20Transfers(): Promise<void> {
    try {
      const latestBlock = await this.provider.getBlockNumber();
      const startBlockHex = await this.getLastProcessedBlock();
      const startBlock = Number(startBlockHex.toString());
      const event = ethers.id('Transfer(address,address,uint256)');
      const batchSize = 100;

      for (
        let fromBlock = startBlock;
        fromBlock <= latestBlock;
        fromBlock += batchSize
      ) {
        const toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);

        console.log(`\nProcessing blocks ${fromBlock} to ${toBlock}...`);

        const logs = await this.provider.getLogs({
          fromBlock,
          toBlock,
          topics: [event],
        });

        await this.storeLogs(logs);

        await this.updateLastProcessedBlock(toBlock);

        console.log(`Processed blocks ${fromBlock} to ${toBlock}`);
      }
    } catch (err) {
      console.error('Error fetching historical logs and storing them:', err);
      throw err;
    }
  }

  async storeLogs(logs: Array<Log>): Promise<void> {
    try {
      const transfers = await logs.map((log) => ({
        transactionHash: ethers.stripZerosLeft(log.transactionHash),
        blockNumber: log.blockNumber,
        tokenAddress: log.address,
        fromAddress: log.topics[1] ? ethers.stripZerosLeft(log.topics[1]) : null,
        toAddress: log.topics[2] ? ethers.stripZerosLeft(log.topics[2]) : null,
        amount: log.data ? ethers.stripZerosLeft(log.data) : null,
      }));

      await this.prisma.transfer.createMany({
        data: transfers,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error storing logs:', error);
      throw error;
    }
  }

  async getLastProcessedBlock(): Promise<number> {
    const lastBlock = await this.prisma.sync_Data.findUnique({
      where: { key: 'last_processed_block' },
    });

    if (!lastBlock) {
      return await this.getFirstBlock();
    }

    return lastBlock.number;
  }

  async updateLastProcessedBlock(blockNumber: number): Promise<void> {
    await this.prisma.sync_Data.upsert({
      where: { key: 'last_processed_block' },
      update: { number: blockNumber },
      create: { key: 'last_processed_block', number: blockNumber },
    });
  }

  //binary search function that gets the first block number created 3 months ago
  async getFirstBlock(): Promise<number> {
    try {
      let left = 0;
      let right = await this.provider.getBlockNumber(); //latest block number
      const targetTimestamp =
        (await this.getBlockTimestampByNumber(right)) - this.threeMonthsInSecs; //timestamp of 3 months ago

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
// async getFirstBlock(): Promise<Block> {
//   const firstBlockTimestamp = new Date(Date.now() - this.threeMonthsInMs);
//   try {
//     const response = await Moralis.EvmApi.block.getDateToBlock({
//       chain: '0x1',
//       date: firstBlockTimestamp,
//     });

//     if (!response?.result?.block) {
//       throw new Error('No block data found for the given date');
//     }

//     const block = await this.alchemy.core.getBlock(response.result.block);
//     return block;
//   } catch (error) {
//     console.error(error);
//   }
// }

//only getting 1000
// async getErcTransfers(): Promise<any[]> {
//   try {
//     const firstBlock = await this.getFirstBlock();
//     const params: AssetTransfersParams = {
//       fromBlock: '0x' + firstBlock.number.toString(16),
//       toBlock: 'latest',
//       category: [AssetTransfersCategory.ERC20],
//     };
//     const transfers = await this.alchemy.core.getAssetTransfers(params);
//     return transfers.transfers;
//   } catch (error) {
//     console.error('Error fetching ERC-20 transfers:', error);
//     throw error;
//   }
// }

// async storeTokens(): Promise<string> {
//   try {
//     const tokens = await this.getErcTransfers();
//     const formattedTokens = tokens.map(token => ({
//       blockNum: token.blockNum,
//       uniqueId: token.uniqueId,
//       hash: token.hash,
//       from: token.from,
//       to: token.to,
//       value: token.value || null,
//       tokenId: token.tokenId || null,
//       asset: token.asset || null,
//       rawContract: token.rawContract,
//       metadata: token.metadata || null,
//     }));
//     await this.prisma.token.deleteMany({})
//     await this.prisma.token.createMany({
//       data: formattedTokens,
//       skipDuplicates: true,
//     });
//     return "Successfully fetched and stored ERC20 token transfers"
//   }
//   catch(error) {
//     throw error;
//   }
// }

//   async getTokenBalances(address): Promise<any[]> {
//     try {
//       const balances = await this.alchemy.core.getTokenBalances(address);
//       const nonZeroBalances = balances.tokenBalances.filter((token) => {
//         return parseInt(token.tokenBalance) !== 0;
//       });

//       let tokens = []

//       for (let token of nonZeroBalances) {
//         const metadata = await this.alchemy.core.getTokenMetadata(token.contractAddress);
//         tokens.push(metadata);
//       }
//       return tokens;
//     }
//     catch(error) {
//       throw error;
//     }
//   }

// async getErcTransfers(): Promise<any[]> {
//   try {
//     const firstBlock = await this.getFirstBlock();
//     const params: AssetTransfersParams = {
//       fromBlock: '0x' + firstBlock.number.toString(16),
//       category: [AssetTransfersCategory.ERC20],
//     };
//     let response = await this.alchemy.core.getAssetTransfers(params);
//     let transfers = response.transfers;
//     let count = 1;
//     while(response.pageKey) {
//       params.pageKey = response.pageKey;
//       response = await this.alchemy.core.getAssetTransfers(params);
//       transfers = transfers.concat(response.transfers)
//       count++;
//       console.log(count)
//     }
//     return transfers;
//   } catch (error) {
//     console.error('Error fetching ERC-20 transfers:', error);
//     throw error;
//   }
// }
