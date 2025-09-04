'use client';

import { PlayerTransaction, DetailedRosterTimeline } from '@/services/playerTracking';
import PlayerHistoryModal from './PlayerHistoryModal';
import { useState } from 'react';

interface PlayerTransactionTimelineProps {
  timeline: DetailedRosterTimeline;
}

export default function PlayerTransactionTimeline({ timeline }: PlayerTransactionTimelineProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const TransactionCard = ({ transaction }: { transaction: PlayerTransaction }) => {
    const isAddition = transaction.transactionType === 'added';
    const bgColor = isAddition ? 'bg-green-50 border-l-green-500' : 'bg-red-50 border-l-red-500';
    const iconColor = isAddition ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
    const icon = isAddition ? '+' : '−';

    const handlePlayerClick = () => {
      setSelectedPlayer({
        id: transaction.playerId,
        name: transaction.playerName
      });
    };

    return (
      <div className={`${bgColor} border-l-4 p-4 rounded-r-lg`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${iconColor}`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={handlePlayerClick}
                className="font-semibold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
              >
                {transaction.playerName}
              </button>
              {transaction.jerseyNumber && (
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                  #{transaction.jerseyNumber}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-600 mb-1">
              {transaction.position}
            </div>
            <div className="text-xs text-slate-500">
              {isAddition ? 'Added to roster' : 'Removed from roster'}
              {transaction.newStatus && ` (${transaction.newStatus})`}
              {transaction.previousStatus && ` (was ${transaction.previousStatus})`}
            </div>
          </div>
          <div className="text-xs text-slate-500 text-right">
            {formatDate(transaction.date)}
          </div>
        </div>
      </div>
    );
  };

  // Group transactions by date
  const transactionsByDate = new Map<string, PlayerTransaction[]>();
  timeline.transactions.forEach(transaction => {
    const date = transaction.date;
    if (!transactionsByDate.has(date)) {
      transactionsByDate.set(date, []);
    }
    transactionsByDate.get(date)!.push(transaction);
  });

  // Sort dates in descending order (most recent first)
  const sortedDates = Array.from(transactionsByDate.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const stats = {
    totalAdded: timeline.transactions.filter(t => t.transactionType === 'added').length,
    totalRemoved: timeline.transactions.filter(t => t.transactionType === 'removed').length,
    uniquePlayers: new Set(timeline.transactions.map(t => t.playerId)).size,
    activeDates: transactionsByDate.size
  };

  if (timeline.transactions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-gray-500 text-lg mb-2">
          No roster transactions found
        </div>
        <p className="text-sm text-gray-400">
          No players were added or removed during the selected period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalAdded}</div>
            <div className="text-sm text-slate-600">Players Added</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalRemoved}</div>
            <div className="text-sm text-slate-600">Players Removed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.uniquePlayers}</div>
            <div className="text-sm text-slate-600">Unique Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.activeDates}</div>
            <div className="text-sm text-slate-600">Active Dates</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Click on any player's name to see their complete transaction history
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction Timeline
        </h3>
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dayTransactions = transactionsByDate.get(date)!;
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="font-medium text-gray-900">
                    {formatDate(date)}
                  </h4>
                  <span className="text-sm text-slate-500">
                    ({dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="ml-6 space-y-2">
                  {dayTransactions
                    .sort((a, b) => a.transactionType === 'added' ? -1 : 1) // Show additions first
                    .map((transaction, index) => (
                    <TransactionCard
                      key={`${transaction.playerId}-${transaction.date}-${index}`}
                      transaction={transaction}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Range Info */}
      <div className="text-center text-sm text-slate-500">
        <p>
          Showing transactions from {formatDate(timeline.dateRange.start)} to {formatDate(timeline.dateRange.end)}
        </p>
        <p className="mt-1">
          Total of {timeline.totalChanges} roster transactions tracked
        </p>
      </div>

      {/* Player History Modal */}
      {selectedPlayer && (
        <PlayerHistoryModal
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          dateRange={timeline.dateRange}
        />
      )}
    </div>
  );
}
