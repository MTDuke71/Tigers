'use client';

import { RosterComparison } from '@/types/changes';
import { RosterEntry } from '@/types/player';

interface RosterChangesDisplayProps {
  comparison: RosterComparison;
}

export default function RosterChangesDisplay({ comparison }: RosterChangesDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const PlayerChangeCard = ({ entry, changeType, details }: {
    entry: RosterEntry;
    changeType: 'added' | 'removed' | 'position_change';
    details?: string;
  }) => {
    const bgColor = changeType === 'added' ? 'bg-green-50 border-green-200' :
                   changeType === 'removed' ? 'bg-red-50 border-red-200' :
                   'bg-yellow-50 border-yellow-200';
    
    const iconColor = changeType === 'added' ? 'text-green-600' :
                     changeType === 'removed' ? 'text-red-600' :
                     'text-yellow-600';

    const icon = changeType === 'added' ? '+' :
                changeType === 'removed' ? '−' :
                '↔';

    return (
      <div className={`p-4 rounded-lg border ${bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${iconColor} bg-white border`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{entry.person.fullName}</span>
              {entry.jerseyNumber && (
                <span className="text-sm text-gray-600">#{entry.jerseyNumber}</span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {entry.position.name} ({entry.position.abbreviation})
            </div>
            {details && (
              <div className="text-sm text-gray-700 mt-1">{details}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasChanges = comparison.added.length > 0 || 
                    comparison.removed.length > 0 || 
                    comparison.positionChanges.length > 0;

  if (!hasChanges) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-500">
          No roster changes between {formatDate(comparison.fromDate)} and {formatDate(comparison.toDate)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Roster Changes: {formatDate(comparison.fromDate)} → {formatDate(comparison.toDate)}
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          {comparison.added.length + comparison.removed.length + comparison.positionChanges.length} total changes
        </div>
      </div>

      <div className="space-y-6">
        {/* Added Players */}
        {comparison.added.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-green-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Players Added ({comparison.added.length})
            </h4>
            <div className="space-y-2">
              {comparison.added.map(entry => (
                <PlayerChangeCard
                  key={entry.person.id}
                  entry={entry}
                  changeType="added"
                  details={`Added to active roster`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Removed Players */}
        {comparison.removed.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-red-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Players Removed ({comparison.removed.length})
            </h4>
            <div className="space-y-2">
              {comparison.removed.map(entry => (
                <PlayerChangeCard
                  key={entry.person.id}
                  entry={entry}
                  changeType="removed"
                  details={`Removed from active roster`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Position Changes */}
        {comparison.positionChanges.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-yellow-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Position Changes ({comparison.positionChanges.length})
            </h4>
            <div className="space-y-2">
              {comparison.positionChanges.map(change => (
                <PlayerChangeCard
                  key={change.player.person.id}
                  entry={change.player}
                  changeType="position_change"
                  details={`${change.previousPosition} → ${change.newPosition}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
