import { RosterEntry } from './player';

export interface RosterChange {
  type: 'added' | 'removed' | 'position_change';
  player: {
    id: number;
    fullName: string;
    jerseyNumber?: string;
  };
  date: string;
  details: string;
  previousPosition?: string;
  newPosition?: string;
}

export interface RosterComparison {
  fromDate: string;
  toDate: string;
  added: RosterEntry[];
  removed: RosterEntry[];
  positionChanges: {
    player: RosterEntry;
    previousPosition: string;
    newPosition: string;
  }[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
