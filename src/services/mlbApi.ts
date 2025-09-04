import { Player, Roster, PlayerStats, ScheduleData } from '@/types/player';
import { CacheService } from './cacheService';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const TIGERS_TEAM_ID = 116; // Detroit Tigers team ID

export class MLBApiService {
  static async getRosterForDate(date: string): Promise<Roster> {
    const cacheKey = CacheService.generateRosterKey(date);
    
    // Try to get from cache first
    const cachedData = await CacheService.get<Roster>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      console.log(`Fetching fresh roster data for ${date}...`);
      const response = await fetch(`${MLB_API_BASE}/teams/${TIGERS_TEAM_ID}/roster?rosterType=active&date=${date}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch roster: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Cache the result
      await CacheService.set(cacheKey, data, 'roster');
      
      return data;
    } catch (error) {
      console.error('Error fetching roster:', error);
      throw error;
    }
  }

  static async getPlayerDetails(playerId: number): Promise<Player> {
    const cacheKey = `player_details_${playerId}`;
    
    // Try to get from cache first
    const cachedData = await CacheService.get<Player>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      console.log(`Fetching fresh player details for ${playerId}...`);
      const response = await fetch(`${MLB_API_BASE}/people/${playerId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch player details: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Cache the result for 1 hour
      await CacheService.set(cacheKey, data.people[0], 'roster');
      
      return data.people[0];
    } catch (error) {
      console.error('Error fetching player details:', error);
      throw error;
    }
  }

  static async getPlayerStats(playerId: number, season: number): Promise<PlayerStats> {
    try {
      const response = await fetch(
        `${MLB_API_BASE}/people/${playerId}/stats?stats=season&season=${season}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch player stats: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  }

  static async getTeamSchedule(startDate: string, endDate: string): Promise<ScheduleData> {
    try {
      const response = await fetch(
        `${MLB_API_BASE}/schedule?teamId=${TIGERS_TEAM_ID}&startDate=${startDate}&endDate=${endDate}&sportId=1`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }
}
