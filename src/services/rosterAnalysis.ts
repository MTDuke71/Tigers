import { Roster, RosterEntry } from '@/types/player';
import { RosterComparison } from '@/types/changes';
import { MLBApiService } from './mlbApi';

export class RosterAnalysisService {
  static async compareRosters(fromDate: string, toDate: string): Promise<RosterComparison> {
    try {
      const [fromRoster, toRoster] = await Promise.all([
        MLBApiService.getRosterForDate(fromDate),
        MLBApiService.getRosterForDate(toDate)
      ]);

      const comparison = this.analyzeRosterChanges(fromRoster, toRoster, fromDate, toDate);
      return comparison;
    } catch (error) {
      console.error('Error comparing rosters:', error);
      throw error;
    }
  }

  private static analyzeRosterChanges(
    fromRoster: Roster,
    toRoster: Roster,
    fromDate: string,
    toDate: string
  ): RosterComparison {
    const fromPlayers = new Map(
      fromRoster.roster.map(entry => [entry.person.id, entry])
    );
    const toPlayers = new Map(
      toRoster.roster.map(entry => [entry.person.id, entry])
    );

    // Find added players
    const added: RosterEntry[] = [];
    toPlayers.forEach((entry, playerId) => {
      if (!fromPlayers.has(playerId)) {
        added.push(entry);
      }
    });

    // Find removed players
    const removed: RosterEntry[] = [];
    fromPlayers.forEach((entry, playerId) => {
      if (!toPlayers.has(playerId)) {
        removed.push(entry);
      }
    });

    // Find position changes
    const positionChanges: {
      player: RosterEntry;
      previousPosition: string;
      newPosition: string;
    }[] = [];

    fromPlayers.forEach((fromEntry, playerId) => {
      const toEntry = toPlayers.get(playerId);
      if (toEntry && fromEntry.position.code !== toEntry.position.code) {
        positionChanges.push({
          player: toEntry,
          previousPosition: fromEntry.position.name,
          newPosition: toEntry.position.name
        });
      }
    });

    return {
      fromDate,
      toDate,
      added,
      removed,
      positionChanges
    };
  }

  static async getRosterChangesTimeline(startDate: string, endDate: string): Promise<RosterComparison[]> {
    const comparisons: RosterComparison[] = [];
    const dates = this.generateDateRange(startDate, endDate);
    
    for (let i = 0; i < dates.length - 1; i++) {
      try {
        const comparison = await this.compareRosters(dates[i], dates[i + 1]);
        if (comparison.added.length > 0 || comparison.removed.length > 0 || comparison.positionChanges.length > 0) {
          comparisons.push(comparison);
        }
      } catch (error) {
        console.warn(`Failed to compare ${dates[i]} to ${dates[i + 1]}:`, error);
      }
    }

    return comparisons;
  }

  private static generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    // Generate weekly intervals to reduce API calls
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7);
    }

    // Add end date if not already included
    const endDateStr = end.toISOString().split('T')[0];
    if (dates[dates.length - 1] !== endDateStr) {
      dates.push(endDateStr);
    }

    return dates;
  }
}
