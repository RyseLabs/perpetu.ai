import React from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Left panel displaying party members
 */
export const PartyPanel: React.FC = () => {
  const { characters, selectedCharacter, setSelectedCharacter } = useGameStore();
  
  const partyMembers = characters.filter((char) => char.isInPlayerParty);
  
  return (
    <div className="h-full bg-panel-bg border-r border-panel-border p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-accent">Party Members</h2>
      
      {partyMembers.length === 0 ? (
        <p className="text-text-secondary text-sm">No party members yet</p>
      ) : (
        <div className="space-y-2">
          {partyMembers.map((character) => {
            // Safe access to stats with fallbacks
            const currentHp = character.stats?.currentHp ?? 0;
            const maxHp = character.stats?.maxHp ?? 0;
            const name = character.name || 'Unknown Character';
            const tier = character.advancementTier || 'Unknown';
            
            return (
              <button
                key={character.id}
                onClick={() => setSelectedCharacter(character)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedCharacter?.id === character.id
                    ? 'bg-accent text-white'
                    : 'bg-panel-border hover:bg-opacity-50'
                }`}
              >
                <div className="font-semibold">{name}</div>
                <div className="text-sm opacity-75">{tier}</div>
                <div className="text-xs mt-1">
                  HP: {currentHp}/{maxHp}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
