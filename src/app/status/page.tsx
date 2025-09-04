'use client';

import { useState, useEffect } from 'react';
import { MLBApiService } from '@/services/mlbApi';
import { TransactionApiService, TransactionDetail } from '@/services/transactionApi';
import { RosterEntry } from '@/types/player';
import PlayerHistoryModal from '@/components/PlayerHistoryModal';
import CacheManager from '@/components/CacheManager';

interface PlayerStatusInfo {
  player: RosterEntry;
  lastTransaction?: TransactionDetail;
  isActive: boolean;
  wasOnMLBRoster?: boolean; // New field to track if player was on MLB roster
}

export default function PlayerStatusPage() {
  const [activePlayers, setActivePlayers] = useState<PlayerStatusInfo[]>([]);
  const [inactiveMLBPlayers, setInactiveMLBPlayers] = useState<PlayerStatusInfo[]>([]);
  const [inactiveMinorPlayers, setInactiveMinorPlayers] = useState<PlayerStatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchPlayerStatusData();
  }, []);

  const fetchPlayerStatusData = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const startOfSeason = '2025-03-01';

      // Get current active roster
      const currentRoster = await MLBApiService.getRosterForDate(currentDate);
      
      // Get all transactions for the season
      const allTransactions = await TransactionApiService.getTeamTransactions(
        startOfSeason,
        currentDate
      );

      console.log('Fetched transactions:', allTransactions.length);
      if (allTransactions.length > 0) {
        console.log('Sample transaction:', allTransactions[0]);
      }

      // Validate transaction data and exclude number changes
      const validTransactions = allTransactions.filter(transaction => {
        const isValid = transaction && 
                       transaction.person && 
                       transaction.person.id && 
                       transaction.person.fullName &&
                       transaction.date &&
                       transaction.typeCode !== 'NUM'; // Exclude number changes
        
        if (!isValid) {
          console.warn('Invalid or filtered transaction:', transaction);
        }
        
        return isValid;
      });

      console.log('Valid transactions:', validTransactions.length);

      // Create a map of player ID to their last transaction
      const playerTransactionMap = new Map<number, TransactionDetail>();
      
      // Sort transactions by date (most recent first) and group by player
      const sortedTransactions = validTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      sortedTransactions.forEach(transaction => {
        // Double-check that we have valid data (should already be filtered)
        if (transaction.person && transaction.person.id) {
          if (!playerTransactionMap.has(transaction.person.id)) {
            playerTransactionMap.set(transaction.person.id, transaction);
          }
        }
      });

      // Process active players
      const activePlayerInfo: PlayerStatusInfo[] = currentRoster.roster.map(player => ({
        player,
        lastTransaction: playerTransactionMap.get(player.person.id),
        isActive: true,
        wasOnMLBRoster: true
      }));

      // Find inactive players (players who had transactions but aren't on current roster)
      const activePlayerIds = new Set(currentRoster.roster.map(p => p.person.id));
      const inactiveMLBPlayerInfo: PlayerStatusInfo[] = [];
      const inactiveMinorPlayerInfo: PlayerStatusInfo[] = [];

      // Get unique players from transactions who aren't currently active
      const allPlayerIds = new Set(
        validTransactions.map(t => t.person.id)
      );
      
      for (const playerId of allPlayerIds) {
        if (!activePlayerIds.has(playerId)) {
          const lastTransaction = playerTransactionMap.get(playerId);
          if (lastTransaction && lastTransaction.person && lastTransaction.person.fullName) {
            // Determine if player was ever on MLB roster by checking transaction types
            const playerTransactions = validTransactions.filter(t => t.person.id === playerId);
            const wasOnMLBRoster = playerTransactions.some(t => 
              // These transaction types indicate MLB roster involvement
              ['SC', 'CU', 'REL', 'DES', 'SFA', 'CLW'].includes(t.typeCode) ||
              // Or if they were moved TO the Tigers (not from minors)
              (t.toTeam?.id === 116 && !t.fromTeam?.name?.includes('Mud Hens') && !t.fromTeam?.name?.includes('Flying Tigers'))
            );

            // Create a mock player entry for inactive players
            const mockPlayer: RosterEntry = {
              person: {
                id: lastTransaction.person.id,
                fullName: lastTransaction.person.fullName,
                firstName: lastTransaction.person.fullName.split(' ')[0] || '',
                lastName: lastTransaction.person.fullName.split(' ').slice(1).join(' ') || '',
                currentAge: 0,
                birthDate: '1990-01-01',
                birthCountry: 'USA',
                height: '6\' 0"',
                weight: 200,
                active: false,
                primaryPosition: {
                  code: 'UNKNOWN',
                  name: 'Unknown',
                  type: 'Unknown',
                  abbreviation: 'UNK'
                }
              },
              jerseyNumber: '',
              position: { code: '', name: 'Unknown', type: '', abbreviation: '' },
              status: { code: '', description: 'Inactive' }
            };
            
            const playerInfo: PlayerStatusInfo = {
              player: mockPlayer,
              lastTransaction,
              isActive: false,
              wasOnMLBRoster
            };

            if (wasOnMLBRoster) {
              inactiveMLBPlayerInfo.push(playerInfo);
            } else {
              inactiveMinorPlayerInfo.push(playerInfo);
            }
          }
        }
      }

      setActivePlayers(activePlayerInfo);
      setInactiveMLBPlayers(inactiveMLBPlayerInfo);
      setInactiveMinorPlayers(inactiveMinorPlayerInfo);
    } catch (err) {
      console.error('Error fetching player status data:', err);
      setError('Failed to load player status information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = (playerId: number, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (typeCode: string) => {
    const info = TransactionApiService.categorizeTransactionType(typeCode);
    return info.icon;
  };

  const getTransactionColor = (typeCode: string) => {
    const info = TransactionApiService.categorizeTransactionType(typeCode);
    switch (info.severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const PlayerTable = ({ 
    players, 
    title, 
    emptyMessage,
    subtitle
  }: { 
    players: PlayerStatusInfo[];
    title: string;
    emptyMessage: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {players.length} player{players.length !== 1 ? 's' : ''}
          {subtitle && <span> • {subtitle}</span>}
        </p>
      </div>
      
      {players.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jersey #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Transaction Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Transaction Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {players
                .sort((a, b) => a.player.person.fullName.localeCompare(b.player.person.fullName))
                .map((playerInfo, index) => (
                <tr key={playerInfo.player.person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handlePlayerClick(playerInfo.player.person.id, playerInfo.player.person.fullName)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                    >
                      {playerInfo.player.person.fullName}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {playerInfo.player.position.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {playerInfo.player.jerseyNumber || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {playerInfo.lastTransaction ? (
                      <div className="text-sm text-gray-900">
                        {formatDate(playerInfo.lastTransaction.date)}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No transactions</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {playerInfo.lastTransaction ? (
                      <div className="max-w-md">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">
                            {getTransactionIcon(playerInfo.lastTransaction.typeCode)}
                          </span>
                          <div>
                            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionColor(playerInfo.lastTransaction.typeCode)}`}>
                              {playerInfo.lastTransaction.typeDesc}
                            </div>
                            {playerInfo.lastTransaction.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {playerInfo.lastTransaction.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No transactions found</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-xl text-gray-600">Loading player status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-lg font-medium">Error</div>
            <div className="text-red-700 mt-2">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Detroit Tigers Player Status</h1>
          <p className="text-gray-600 mt-2">
            Current roster status and last transaction details as of {formatDate(new Date().toISOString().split('T')[0])}
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <a
              href="/"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              ← Back to Roster
            </a>
            <a
              href="/changes"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              View Changes
            </a>
          </nav>
        </div>

        <div className="space-y-8">
          {/* Active Players Table */}
          <PlayerTable
            players={activePlayers}
            title="Active Players"
            emptyMessage="No active players found"
            subtitle="Currently on 40-man roster"
          />

          {/* Inactive MLB Players Table */}
          <PlayerTable
            players={inactiveMLBPlayers}
            title="Inactive MLB Players"
            emptyMessage="No inactive MLB players found"
            subtitle="Were on major league roster this season"
          />

          {/* Inactive Minor League Players Table */}
          <PlayerTable
            players={inactiveMinorPlayers}
            title="Inactive Minor League Players"
            emptyMessage="No inactive minor league players found"
            subtitle="Only minor league transactions this season"
          />
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{activePlayers.length}</div>
              <div className="text-sm text-green-700">Active Players</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{inactiveMLBPlayers.length}</div>
              <div className="text-sm text-orange-700">Inactive MLB Players</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{inactiveMinorPlayers.length}</div>
              <div className="text-sm text-blue-700">Inactive Minor Players</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {activePlayers.filter(p => p.lastTransaction).length + 
                 inactiveMLBPlayers.filter(p => p.lastTransaction).length + 
                 inactiveMinorPlayers.filter(p => p.lastTransaction).length}
              </div>
              <div className="text-sm text-purple-700">Total with Transactions</div>
            </div>
          </div>
        </div>

        {/* Cache Management */}
        <div className="mt-8">
          <CacheManager />
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
            start: '2025-03-01',
            end: new Date().toISOString().split('T')[0]
          }}
        />
      )}
    </div>
  );
}
