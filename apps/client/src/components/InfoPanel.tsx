import React from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Right panel displaying selected character information
 */
export const InfoPanel: React.FC = () => {
  const { selectedCharacter } = useGameStore();
  
  if (!selectedCharacter) {
    return (
      <div className="h-full bg-panel-bg border-l border-panel-border p-4">
        <h2 className="text-xl font-bold mb-4 text-accent">Character Info</h2>
        <p className="text-text-secondary text-sm">
          Select a character on the map to view their information
        </p>
      </div>
    );
  }
  
  const { discoveredByPlayer } = selectedCharacter;
  
  return (
    <div className="h-full bg-panel-bg border-l border-panel-border p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-accent">Character Info</h2>
      
      <div className="space-y-4">
        {/* Basic Info */}
        <div>
          <h3 className="font-semibold text-lg mb-2">
            {discoveredByPlayer ? selectedCharacter.name : 'Unknown'}
          </h3>
          {discoveredByPlayer && selectedCharacter.description && (
            <p className="text-sm text-text-secondary">{selectedCharacter.description}</p>
          )}
        </div>
        
        {discoveredByPlayer ? (
          <>
            {/* Advancement & Faction */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-text-secondary">Tier</div>
                <div className="font-semibold">{selectedCharacter.advancementTier}</div>
              </div>
              {selectedCharacter.faction && (
                <div>
                  <div className="text-text-secondary">Faction</div>
                  <div className="font-semibold">{selectedCharacter.faction}</div>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div>
              <h4 className="font-semibold mb-2">Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>HP: {selectedCharacter.stats.currentHp}/{selectedCharacter.stats.maxHp}</div>
                <div>AC: {selectedCharacter.stats.armorClass}</div>
                <div>STR: {selectedCharacter.stats.strength}</div>
                <div>DEX: {selectedCharacter.stats.dexterity}</div>
                <div>CON: {selectedCharacter.stats.constitution}</div>
                <div>INT: {selectedCharacter.stats.intelligence}</div>
                <div>WIS: {selectedCharacter.stats.wisdom}</div>
                <div>CHA: {selectedCharacter.stats.charisma}</div>
              </div>
            </div>
            
            {/* Madra Core */}
            <div>
              <h4 className="font-semibold mb-2">Madra Core</h4>
              <div className="text-sm space-y-1">
                <div>Nature: {selectedCharacter.madraCore.nature}</div>
                <div>
                  Capacity: {selectedCharacter.madraCore.currentMadra}/
                  {selectedCharacter.madraCore.maxMadra}
                </div>
              </div>
            </div>
            
            {/* Activity */}
            <div>
              <h4 className="font-semibold mb-2">Current Activity</h4>
              <div className="text-sm">
                <div className="capitalize">{selectedCharacter.activity}</div>
                {selectedCharacter.currentGoal && (
                  <div className="text-text-secondary mt-1">
                    Goal: {selectedCharacter.currentGoal}
                  </div>
                )}
              </div>
            </div>
            
            {/* Techniques */}
            {selectedCharacter.techniques.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Techniques</h4>
                <div className="space-y-2">
                  {selectedCharacter.techniques.map((technique) => (
                    <div
                      key={technique.id}
                      className="p-2 bg-panel-border rounded text-sm"
                    >
                      <div className="font-semibold">{technique.name}</div>
                      <div className="text-text-secondary text-xs">
                        {technique.nature} • Cost: {technique.madraCost} • Tier: {technique.requiredTier}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Inventory */}
            {selectedCharacter.inventory.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Inventory</h4>
                <div className="space-y-1 text-sm">
                  {selectedCharacter.inventory.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="text-text-secondary">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-text-secondary text-sm">
            You haven't discovered this character yet. Interact with them to learn more.
          </div>
        )}
      </div>
    </div>
  );
};
