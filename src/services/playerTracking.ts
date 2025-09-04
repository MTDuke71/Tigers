import { Roster, RosterEntry } from '@/types/player';
import { RosterComparison } from '@/types/changes';
import { MLBApiService } from './mlbApi';
import { CacheService } from './cacheService';

export interface PlayerTransaction {
  playerId: number;
  playerName: string;
  jerseyNumber?: string;
  position: string;
  transactionType: 'added' | 'removed';
  date: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface DetailedRosterTimeline {
  transactions: PlayerTransaction[];
  dateRange: {
    start: string;
    end: string;
  };
  totalChanges: number;
}

export class DetailedRosterAnalysisService {
  static async getPlayerTransactionHistory(startDate: string, endDate: string): Promise<DetailedRosterTimeline> {
    try {
      const transactions: PlayerTransaction[] = [];
      const dates = this.generateDailyDateRange(startDate, endDate);
      
      let previousRoster: Map<number, RosterEntry> | null = null;
      
      for (let i = 0; i < dates.length; i++) {
        const currentDate = dates[i];
        
        try {
          const currentRosterData = await MLBApiService.getRosterForDate(currentDate);
          const currentRoster = new Map(
            currentRosterData.roster.map(entry => [entry.person.id, entry])
          );
          
          if (previousRoster) {
            // Check for additions
            currentRoster.forEach((entry, playerId) => {
              if (!previousRoster!.has(playerId)) {
                transactions.push({
                  playerId: entry.person.id,
                  playerName: entry.person.fullName,
                  jerseyNumber: entry.jerseyNumber,
                  position: entry.position.name,
                  transactionType: 'added',
                  date: currentDate,
                  newStatus: entry.status.description
                });
              }
            });
            
            // Check for removals
            previousRoster.forEach((entry, playerId) => {
              if (!currentRoster.has(playerId)) {
                transactions.push({
                  playerId: entry.person.id,
                  playerName: entry.person.fullName,
                  jerseyNumber: entry.jerseyNumber,
                  position: entry.position.name,
                  transactionType: 'removed',
                  date: currentDate,
                  previousStatus: entry.status.description
                });
              }
            });
          }
          
          previousRoster = currentRoster;
          
          // Add small delay to avoid overwhelming the API
          if (i < dates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          console.warn(`Failed to fetch roster for ${currentDate}:`, error);
          continue;
        }
      }
      
      return {
        transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        dateRange: {
          start: startDate,
          end: endDate
        },
        totalChanges: transactions.length
      };
      
    } catch (error) {
      console.error('Error getting player transaction history:', error);
      throw error;
    }
  }

  static async getPlayerSpecificHistory(playerId: number, startDate: string, endDate: string): Promise<PlayerTransaction[]> {
    const cacheKey = CacheService.generatePlayerHistoryKey(playerId, startDate, endDate);
    
    // Try to get from cache first
    const cachedData = await CacheService.get<PlayerTransaction[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      console.log(`Fetching fresh player history for ${playerId}...`);
      const fullHistory = await this.getPlayerTransactionHistory(startDate, endDate);
      const playerHistory = fullHistory.transactions.filter(transaction => transaction.playerId === playerId);
      
      // Cache the result
      await CacheService.set(cacheKey, playerHistory, 'playerHistory');
      
      return playerHistory;
    } catch (error) {
      console.error('Error getting player-specific history:', error);
      throw error;
    }
  }

  private static generateDailyDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    // For detailed tracking, we'll check more frequently but with some optimization
    const daysDiff = Math.abs(end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 14) {
      // For 2 weeks or less, check daily
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    } else if (daysDiff <= 60) {
      // For 2 months or less, check every 3 days
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 3);
      }
    } else {
      // For longer periods, check weekly
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 7);
      }
    }

    return dates;
  }

  static groupTransactionsByDate(transactions: PlayerTransaction[]): Map<string, PlayerTransaction[]> {
    const grouped = new Map<string, PlayerTransaction[]>();
    
    transactions.forEach(transaction => {
      const date = transaction.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(transaction);
    });
    
    return grouped;
  }

  static getPlayerStats(transactions: PlayerTransaction[]): {
    mostActiveDate: string;
    totalAdded: number;
    totalRemoved: number;
    uniquePlayers: number;
  } {
    const byDate = this.groupTransactionsByDate(transactions);
    let mostActiveDate = '';
    let maxTransactions = 0;
    
    byDate.forEach((dayTransactions, date) => {
      if (dayTransactions.length > maxTransactions) {
        maxTransactions = dayTransactions.length;
        mostActiveDate = date;
      }
    });
    
    const totalAdded = transactions.filter(t => t.transactionType === 'added').length;
    const totalRemoved = transactions.filter(t => t.transactionType === 'removed').length;
    const uniquePlayers = new Set(transactions.map(t => t.playerId)).size;
    
    return {
      mostActiveDate,
      totalAdded,
      totalRemoved,
      uniquePlayers
    };
  }
}
