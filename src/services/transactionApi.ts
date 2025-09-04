export interface TransactionDetail {
  id: number;
  person: {
    id: number;
    fullName: string;
  };
  date: string;
  effectiveDate: string;
  resolutionDate?: string;
  typeCode: string;
  typeDesc: string;
  description?: string;
  fromTeam?: {
    id: number;
    name: string;
  };
  toTeam?: {
    id: number;
    name: string;
  };
}

export interface TransactionApiResponse {
  transactions: TransactionDetail[];
}

import { CacheService } from './cacheService';

export class TransactionApiService {
  private static readonly BASE_URL = 'https://statsapi.mlb.com/api/v1';
  private static readonly TIGERS_TEAM_ID = 116;

  static async getPlayerTransactions(
    playerId: number,
    startDate: string,
    endDate: string
  ): Promise<TransactionDetail[]> {
    const cacheKey = CacheService.generateTransactionsKey(startDate, endDate, playerId);
    
    // Try to get from cache first
    const cachedData = await CacheService.get<TransactionDetail[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      console.log(`Fetching fresh transaction data for player ${playerId}...`);
      // Get all Tigers transactions for the date range
      const url = `${this.BASE_URL}/transactions?teamId=${this.TIGERS_TEAM_ID}&startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Transaction API request failed: ${response.status}`);
      }
      
      const data: TransactionApiResponse = await response.json();
      
      // Filter for transactions involving the specific player, excluding number changes
      const playerTransactions = data.transactions.filter(transaction => 
        transaction.person.id === playerId && 
        transaction.typeCode !== 'NUM' // Exclude number changes
      );
      
      // Cache the result
      await CacheService.set(cacheKey, playerTransactions, 'transactions');
      
      return playerTransactions;
    } catch (error) {
      console.error('Error fetching player transactions:', error);
      return [];
    }
  }

  static async getTeamTransactions(
    startDate: string,
    endDate: string
  ): Promise<TransactionDetail[]> {
    const cacheKey = CacheService.generateTransactionsKey(startDate, endDate);
    
    // Try to get from cache first
    const cachedData = await CacheService.get<TransactionDetail[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      console.log(`Fetching fresh team transaction data for ${startDate} to ${endDate}...`);
      const url = `${this.BASE_URL}/transactions?teamId=${this.TIGERS_TEAM_ID}&startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Transaction API request failed: ${response.status}`);
      }
      
      const data: TransactionApiResponse = await response.json();
      
      // Filter out number changes as they're not significant roster moves
      const filteredTransactions = data.transactions.filter(transaction => 
        transaction.typeCode !== 'NUM'
      );
      
      // Cache the result
      await CacheService.set(cacheKey, filteredTransactions, 'transactions');
      
      return filteredTransactions;
    } catch (error) {
      console.error('Error fetching team transactions:', error);
      return [];
    }
  }

  static categorizeTransactionType(typeCode: string): {
    category: 'injury' | 'trade' | 'option' | 'release' | 'assignment' | 'signing' | 'other';
    severity: 'high' | 'medium' | 'low';
    icon: string;
  } {
    switch (typeCode) {
      case 'SC': // Status Change (usually injury list)
        return { category: 'injury', severity: 'high', icon: '🏥' };
      case 'TRD': // Trade
        return { category: 'trade', severity: 'high', icon: '🔄' };
      case 'OPT': // Optioned
        return { category: 'option', severity: 'medium', icon: '⬇️' };
      case 'CU': // Recalled
        return { category: 'option', severity: 'medium', icon: '⬆️' };
      case 'REL': // Released
        return { category: 'release', severity: 'high', icon: '❌' };
      case 'DES': // Designated for Assignment
        return { category: 'assignment', severity: 'high', icon: '🎯' };
      case 'OUT': // Outrighted
        return { category: 'assignment', severity: 'medium', icon: '📤' };
      case 'SFA': // Signed as Free Agent
        return { category: 'signing', severity: 'low', icon: '✍️' };
      case 'CLW': // Claimed Off Waivers
        return { category: 'signing', severity: 'low', icon: '🎣' };
      case 'ASG': // Assigned
        return { category: 'assignment', severity: 'low', icon: '📝' };
      case 'NUM': // Number Change (should be filtered out, but handle if present)
        return { category: 'other', severity: 'low', icon: '🔢' };
      default:
        return { category: 'other', severity: 'low', icon: '📋' };
    }
  }

  static formatTransactionDescription(transaction: TransactionDetail): string {
    if (transaction.description) {
      return transaction.description;
    }

    // Fallback to creating description from available data
    const { category } = this.categorizeTransactionType(transaction.typeCode);
    const playerName = transaction.person.fullName;
    
    switch (transaction.typeCode) {
      case 'SC':
        return `${playerName} placed on injured list`;
      case 'CU':
        return `${playerName} recalled from ${transaction.fromTeam?.name || 'minors'}`;
      case 'OPT':
        return `${playerName} optioned to ${transaction.toTeam?.name || 'minors'}`;
      case 'REL':
        return `${playerName} released`;
      case 'DES':
        return `${playerName} designated for assignment`;
      case 'OUT':
        return `${playerName} outrighted to ${transaction.toTeam?.name || 'minors'}`;
      default:
        return `${playerName} - ${transaction.typeDesc}`;
    }
  }
}
