export interface Player {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryNumber?: number;
  currentAge: number;
  birthDate: string;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry: string;
  height: string;
  weight: number;
  active: boolean;
  primaryPosition: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  batSide?: {
    code: string;
    description: string;
  };
  pitchHand?: {
    code: string;
    description: string;
  };
  currentTeam?: {
    id: number;
    name: string;
    link: string;
  };
  mlbDebutDate?: string;
  stats?: PlayerStats[];
}

export interface PlayerStats {
  type: {
    displayName: string;
  };
  group: {
    displayName: string;
  };
  splits: StatSplit[];
}

export interface StatSplit {
  season: string;
  stat: Record<string, number | string>;
  team?: {
    id: number;
    name: string;
  };
}

export interface ScheduleData {
  dates: ScheduleDate[];
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalGamesInProgress: number;
}

export interface ScheduleDate {
  date: string;
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  games: Game[];
}

export interface Game {
  gamePk: number;
  gameDate: string;
  status: {
    statusCode: string;
    detailedState: string;
  };
  teams: {
    away: TeamInfo;
    home: TeamInfo;
  };
}

export interface TeamInfo {
  team: {
    id: number;
    name: string;
  };
  score?: number;
}

export interface Roster {
  copyright: string;
  roster: RosterEntry[];
  link: string;
  version: string;
}

export interface RosterEntry {
  person: Player;
  jerseyNumber?: string;
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  status: {
    code: string;
    description: string;
  };
}
