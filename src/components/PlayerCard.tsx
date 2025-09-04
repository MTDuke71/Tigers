'use client';

import { RosterEntry } from '@/types/player';

interface PlayerCardProps {
  rosterEntry: RosterEntry;
  onClick?: (playerId: number, playerName: string) => void;
}

export default function PlayerCard({ rosterEntry, onClick }: PlayerCardProps) {
  const { person, jerseyNumber, position, status } = rosterEntry;

  const getPositionColor = (posType: string) => {
    switch (posType) {
      case 'Pitcher':
        return 'bg-red-100 text-red-800';
      case 'Catcher':
        return 'bg-purple-100 text-purple-800';
      case 'Infielder':
        return 'bg-blue-100 text-blue-800';
      case 'Outfielder':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isActive = status.code === 'A';

  const handleClick = () => {
    if (onClick) {
      onClick(person.id, person.fullName);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
        !isActive ? 'opacity-70' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {jerseyNumber && (
            <div className="w-10 h-10 bg-navy-900 text-white rounded-full flex items-center justify-center font-bold">
              {jerseyNumber}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{person.fullName}</h3>
            <p className="text-sm text-slate-600">Age: {person.currentAge}</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(
              position.type
            )}`}
          >
            {position.abbreviation}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-slate-500">Position:</span>
          <div className="font-medium">{position.name}</div>
        </div>
        <div>
          <span className="text-slate-500">Status:</span>
          <div className={`font-medium ${isActive ? 'text-green-600' : 'text-orange-600'}`}>
            {status.description}
          </div>
        </div>
        {person.batSide && (
          <div>
            <span className="text-slate-500">Bats:</span>
            <div className="font-medium">{person.batSide.description}</div>
          </div>
        )}
        {person.pitchHand && (
          <div>
            <span className="text-slate-500">Throws:</span>
            <div className="font-medium">{person.pitchHand.description}</div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Height: {person.height}</span>
          <span>Weight: {person.weight} lbs</span>
        </div>
        {person.birthDate && (
          <div className="text-sm text-slate-600 mt-1">
            Born: {new Date(person.birthDate).toLocaleDateString()}{' '}
            {person.birthCity && person.birthStateProvince && (
              <span>in {person.birthCity}, {person.birthStateProvince}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
