import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../external/db/database.service';
import { ethers } from 'ethers';

@Injectable()
export class BalanceService {
  walletTokenBalances: Map<string, Map<string, { name: string; symbol: string; amount: string }>>;
  constructor(
    private dbService: DatabaseService,
  ) {
    this.walletTokenBalances = new Map()
  }

  async tokenBalances(walletAddress: string) {
    const result: Array<{
      tokenAddress: string;
      name: string;
      symbol: string;
      amount: string;
    }> = [];

    await this.addBalance(walletAddress);
    await this.deductBalance(walletAddress);

    this.walletTokenBalances.get(walletAddress).forEach((tokenData, tokenAddress) => {
      result.push({
        tokenAddress: tokenAddress,
        name: tokenData.name,
        symbol: tokenData.symbol,
        amount: tokenData.amount
      })
    })
    return result
  }

  //get logs where address = toAddress and add balances
  async addBalance(walletAddress: string) {
    const logs = await this.dbService.receiver(walletAddress);

    for (const log of logs) {
      const token = await this.dbService.getToken(log.tokenAddress);

      if (token) {
        const formattedAmount = ethers.formatUnits(log.amount, token.decimals);

        if (!this.walletTokenBalances.has(walletAddress)) {
          this.walletTokenBalances.set(walletAddress, new Map());
        }

        const tokenBalances = this.walletTokenBalances.get(walletAddress)!;

        if (tokenBalances.has(log.tokenAddress)) {
          const existingToken = tokenBalances.get(log.tokenAddress);
          existingToken.amount = (parseFloat(existingToken.amount) + parseFloat(formattedAmount)).toString();
        } else {
          tokenBalances.set(log.tokenAddress, {
            name: token.name,
            symbol: token.symbol,
            amount: formattedAmount,
          });
        }
      }
    }
  }

  //get logs where address = fromAddress
  async deductBalance(walletAddress: string) {
    const logs = await this.dbService.sender(walletAddress);

    for (const log of logs) {
      const token = await this.dbService.getToken(log.tokenAddress);

      if (token) {
        const formattedAmount = ethers.formatUnits(log.amount, token.decimals);

        if (!this.walletTokenBalances.has(walletAddress)) {
          this.walletTokenBalances.set(walletAddress, new Map());
        }

        const tokenBalances = this.walletTokenBalances.get(walletAddress)!;

        if (tokenBalances.has(log.tokenAddress)) {
          const existingToken = tokenBalances.get(log.tokenAddress);
          existingToken.amount = (parseFloat(existingToken.amount) - parseFloat(formattedAmount)).toString();
        } else {
          tokenBalances.set(log.tokenAddress, {
            name: token.name,
            symbol: token.symbol,
            amount: '-' + formattedAmount,
          });
        }
      }
    }
  }
}
