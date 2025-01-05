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

@Injectable()
export class AppService {
  private alchemy: Alchemy;
  private readonly moralisApiKey: string = this.configService.get<string>('MORALIS_API_KEY')
  private readonly alchemyApiKey: string = this.configService.get<string>('ALCHEMY_API_KEY')
  private readonly threeMonthsInMs: number = 7776000000;

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
}
