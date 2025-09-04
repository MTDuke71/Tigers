'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DateSelector from '@/components/DateSelector';
import PlayerCard from '@/components/PlayerCard';
import PlayerHistoryModal from '@/components/PlayerHistoryModal';
import { MLBApiService } from '@/services/mlbApi';
import { Roster, RosterEntry } from '@/types/player';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>('2025-09-01');
  const [roster, setRoster] = useState<Roster | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchRoster = async (date: string) => {
    setLoading(true);
    setError('');
    try {
      const rosterData = await MLBApiService.getRosterForDate(date);
      setRoster(rosterData);
    } catch (err) {
      setError('Failed to fetch roster data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchRoster(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handlePlayerClick = (playerId: number, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName });
  };

  const groupPlayersByPosition = (rosterEntries: RosterEntry[]) => {
    const groups: { [key: string]: RosterEntry[] } = {
      'Pitchers': [],
      'Catchers': [],
      'Infielders': [],
      'Outfielders': []
    };

    rosterEntries.forEach(entry => {
      const posType = entry.position.type;
      if (posType === 'Pitcher') {
        groups['Pitchers'].push(entry);
      } else if (posType === 'Catcher') {
        groups['Catchers'].push(entry);
      } else if (posType === 'Infielder') {
        groups['Infielders'].push(entry);
      } else if (posType === 'Outfielder') {
        groups['Outfielders'].push(entry);
      }
    });

    return groups;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">D</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Detroit Tigers Roster</h1>
                <p className="text-blue-200">Historical roster for any day of the season</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/changes"
                className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                View Changes →
              </Link>
              <Link
                href="/status"
                className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Player Status →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Date Selector */}
        <div className="mb-8">
          <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading roster...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-600">
                <span className="font-medium">Error:</span> {error}
              </div>
            </div>
          </div>
        )}

        {/* Roster Display */}
        {roster && !loading && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Detroit Tigers Active Roster
              </h2>
              <p className="text-slate-600">
                As of {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Total Players: {roster.roster.length}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                💡 Click any player card to view their transaction history
              </p>
            </div>

            {Object.entries(groupPlayersByPosition(roster.roster)).map(([positionGroup, players]) => (
              players.length > 0 && (
                <div key={positionGroup}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    {positionGroup} ({players.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((rosterEntry) => (
                      <PlayerCard
                        key={rosterEntry.person.id}
                        rosterEntry={rosterEntry}
                        onClick={handlePlayerClick}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-slate-500">
          <p>Data provided by MLB Stats API</p>
          <p className="mt-1">© 2025 Detroit Tigers Roster App</p>
          <p className="mt-2 text-blue-600">💡 Click on any player card to see their transaction history</p>
        </div>
      </div>

      {/* Player History Modal */}
      {selectedPlayer && (
        <PlayerHistoryModal
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          dateRange={{
            start: '2025-03-18',
            end: '2025-09-28'
          }}
        />
      )}
    </div>
  );
}
