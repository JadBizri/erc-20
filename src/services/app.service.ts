import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Block, ethers } from 'ethers';

@Injectable()
export class AppService {
  private readonly alchemyApiKey: string = this.configService.get<string>('ALCHEMY_API_KEY');
  private readonly url: string = "https://eth-mainnet.g.alchemy.com/v2/" + this.alchemyApiKey;
  private readonly threeMonthsInSecs: number = 7776000;
  private prisma = new PrismaClient();
  private provider = new ethers.JsonRpcProvider(this.url);

  constructor(private configService: ConfigService) {}

  async getBlock(): Promise<Block> {
    return await this.provider.send('eth_getBlockByNumber', ["0x13f447e", false])
  }


  //binary search function that gets the first block created 3 months ago
  async getFirstBlock(): Promise<Block> {
    try{
      let left = 0;
      let right = await this.provider.getBlockNumber(); //latest block number
      const targetTimestamp = await this.getBlockTimestampByNumber(right) - this.threeMonthsInSecs; //timestamp of 3 months ago
      
      let targetBlock: Block;

      while(left <= right) {
        const mid = Math.floor((left + right) / 2)
        targetBlock = await this.provider.send('eth_getBlockByNumber', ['0x' + (mid).toString(16), false]);
        const midTimestamp = targetBlock.timestamp;

        if(midTimestamp === targetTimestamp) {
          return targetBlock;
        }

        if (midTimestamp < targetTimestamp) {
          left = mid + 1;
        } else right = mid - 1;
      }
      return targetBlock;
    }
    catch(err) {
      throw err;
    }
  }

  async getBlockTimestampByNumber(blockNum: number): Promise<number> {
    return await this.provider.send('eth_getBlockByNumber', ['0x' + (blockNum).toString(16), false])
    .then((block) => {
      return block.timestamp; 
    })
    .catch((err) => {
      console.error("ERROR: ", err)
      throw err;
    })
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