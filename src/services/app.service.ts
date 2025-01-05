import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Alchemy,
  Network,
  Block,
  AssetTransfersCategory,
  AssetTransfersParams,
} from 'alchemy-sdk';
import Moralis from 'moralis';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppService {
  private alchemy: Alchemy;
  private readonly moralisApiKey: string = this.configService.get<string>('MORALIS_API_KEY')
  private readonly alchemyApiKey: string = this.configService.get<string>('ALCHEMY_API_KEY')
  private readonly threeMonthsInMs: number = 7776000000;
  private prisma = new PrismaClient();

  constructor(private configService: ConfigService) {
    const settings = {
      apiKey: this.alchemyApiKey,
      network: Network.ETH_MAINNET,
    };
    this.alchemy = new Alchemy(settings);

    Moralis.start({ apiKey: this.moralisApiKey });
  }

  async getTheLatestBlock(): Promise<Block> {
    return this.alchemy.core
      .getBlock('latest')
      .then((block) => {
        return block;
      })
      .catch((error) => {
        console.error('Error fetching block:', error);
        throw error;
      });
  }

  async getFirstBlock(): Promise<Block> {
    const firstBlockTimestamp = new Date(Date.now() - this.threeMonthsInMs);
    try {
      const response = await Moralis.EvmApi.block.getDateToBlock({
        chain: '0x1',
        date: firstBlockTimestamp,
      });

      if (!response?.result?.block) {
        throw new Error('No block data found for the given date');
      }

      const block = await this.alchemy.core.getBlock(response.result.block);
      return block;
    } catch (error) {
      console.error(error);
    }
  }

  //only getting most recent 1000
  async getErcTransfers(): Promise<any[]> {
    try {
      const firstBlock = await this.getFirstBlock();
      const params: AssetTransfersParams = {
        fromBlock: '0x' + firstBlock.number.toString(16),
        toBlock: 'latest',
        category: [AssetTransfersCategory.ERC20],
      };
      const transfers = await this.alchemy.core.getAssetTransfers(params);
      return transfers.transfers;
    } catch (error) {
      console.error('Error fetching ERC-20 transfers:', error);
      throw error;
    }
  }

  async storeTokens(): Promise<string> {
    try {
      const tokens = await this.getErcTransfers();
      const formattedTokens = tokens.map(token => ({
        blockNum: token.blockNum,
        uniqueId: token.uniqueId,
        hash: token.hash,
        from: token.from,
        to: token.to,
        value: token.value || null,
        tokenId: token.tokenId || null,
        asset: token.asset || null,
        rawContract: token.rawContract,
        metadata: token.metadata || null,
      }));
      await this.prisma.token.deleteMany({})
      // Bulk insert tokens into the database
      await this.prisma.token.createMany({
        data: formattedTokens,
        skipDuplicates: true, // Avoid duplicate entries
      });
      return "Successfully fetched and stored ERC20 token transfers"
    }
    catch(error) {
      throw error;
    }
  }

  async getTokenBalances(address): Promise<any[]> {
    try {
      const balances = await this.alchemy.core.getTokenBalances(address);
      const nonZeroBalances = balances.tokenBalances.filter((token) => {
        return parseInt(token.tokenBalance) !== 0;
      });

      let tokens = []

      for (let token of nonZeroBalances) {
        const metadata = await this.alchemy.core.getTokenMetadata(token.contractAddress);
        tokens.push(metadata);
      }
      return tokens;
    }
    catch(error) {
      throw error;
    }
  }
}


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