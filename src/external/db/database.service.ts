import { Injectable } from '@nestjs/common';
import { PrismaClient, Token } from '@prisma/client';
import { TransferLogDto } from 'src/core/dto/transfer-log.dto';

@Injectable()
export class DatabaseService {
  private prisma = new PrismaClient();

  constructor() {}

  async storeLogs(logs: Array<any>): Promise<void> {
    try {
      const uniqueBlockNumbers = [
        ...new Set(logs.map((transfer) => transfer.blockNumber)),
      ];

      for (const blockNumber of uniqueBlockNumbers) {
        await this.prisma.block.upsert({
          where: { number: blockNumber },
          update: {},
          create: { number: blockNumber },
        });
      }

      await this.prisma.transfer.createMany({
        data: logs,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error storing logs:', error);
      throw error;
    }
  }

  async getLastProcessedBlock(): Promise<number> {
    const lastBlock = await this.prisma.block.findFirst({
      orderBy: {
        number: 'desc',
      },
      take: 1,
    });

    return lastBlock ? lastBlock.number : 0;
  }

  async storeFailedLog(log): Promise<void> {
    await this.prisma.failedLog.create({
      data: log
    })
  }

  async storeTokenData(tokensData: Array<{tokenAddress: string; name: string; decimals: number; symbol: string;}>): Promise<void> {
    await this.prisma.token.createMany({
      data: tokensData,
      skipDuplicates: true
    })
    .then()
    .catch((error) => {
      console.error("ERROR STORING TOKEN METADATA: " + error)
      throw error
    })
  }

  async receiver(walletAddress: string): Promise<Array<TransferLogDto>> {
    return await this.prisma.transfer.findMany({
      where: {
        toAddress: walletAddress
      }
    })
    .then((logs) => logs)
    .catch((error) => {
      console.error("Error getting matching logs: " + error.message)
      throw error;
    })
  }

  async sender(walletAddress: string): Promise<Array<TransferLogDto>> {
    return await this.prisma.transfer.findMany({
      where: {
        fromAddress: walletAddress
      }
    })
    .then((logs) => logs)
    .catch((error) => {
      console.error("Error getting matching logs: " + error.message)
      throw error;
    })
  }

  async getToken(tokenAddress: string): Promise<Token> {
    const token = await this.prisma.token.findUnique({
      where: {
        tokenAddress: tokenAddress
      }
    })
    return token
  }
}
