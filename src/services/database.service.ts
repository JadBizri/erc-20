import { Injectable } from '@nestjs/common';
import { Log, ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService {

  private prisma = new PrismaClient();

  constructor() {}

  async storeLogs(logs: Array<any>): Promise<void> {
      try {
        const uniqueBlockNumbers = [...new Set(logs.map((transfer) => transfer.blockNumber))];
  
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
        number: 'desc'
      },
      take: 1
    });

    return lastBlock ? lastBlock.number : 0;
  }
}
