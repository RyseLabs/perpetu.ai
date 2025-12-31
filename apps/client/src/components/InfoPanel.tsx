import React from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Calculate distance between two points
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Right panel displaying selected character or location information
 */
export const InfoPanel: React.FC = () => {
  const { selectedCharacter, selectedLocation, characters } = useGameStore();
  
  // Show location info if selected
  if (selectedLocation) {
    const playerCharacter = characters.find(c => c.isPlayerCharacter);
    const distance = playerCharacter && playerCharacter.position
      ? calculateDistance(
          playerCharacter.position.x,
          playerCharacter.position.y,
          selectedLocation.position.x,
          selectedLocation.position.y
        ).toFixed(1)
      : 'N/A';
    
    const charactersAtLocation = characters.filter(
      c => c.position && 
           Math.abs(c.position.x - selectedLocation.position.x) < 1 &&
           Math.abs(c.position.y - selectedLocation.position.y) < 1
    );
    
    return (
      <div className="h-full bg-panel-bg border-l border-panel-border p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-accent">Location Info</h2>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{selectedLocation.name}</h3>
            <p className="text-sm text-text-secondary">{selectedLocation.description}</p>
          </div>
          
          {/* Location Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-text-secondary">Type</div>
              <div className="font-semibold capitalize">{selectedLocation.type}</div>
            </div>
            <div>
              <div className="text-text-secondary">Position</div>
              <div className="font-semibold">
                ({selectedLocation.position.x.toFixed(1)}, {selectedLocation.position.y.toFixed(1)})
              </div>
            </div>
            {selectedLocation.faction && (
              <div className="col-span-2">
                <div className="text-text-secondary">Faction</div>
                <div className="font-semibold">{selectedLocation.faction}</div>
              </div>
            )}
            {playerCharacter && (
              <div className="col-span-2">
                <div className="text-text-secondary">Distance from You</div>
                <div className="font-semibold">{distance} units</div>
              </div>
            )}
          </div>
          
          {/* Characters at location */}
          {charactersAtLocation.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Characters Here</h4>
              <div className="space-y-2">
                {charactersAtLocation.map((character) => (
                  <div
                    key={character.id}
                    className="p-2 bg-panel-border rounded text-sm"
                  >
                    <div className="font-semibold">
                      {character.discoveredByPlayer ? character.name : 'Unknown'}
                    </div>
                    <div className="text-text-secondary text-xs">
                      {character.advancementTier}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Show character info if selected
  if (!selectedCharacter) {
    return (
      <div className="h-full bg-panel-bg border-l border-panel-border p-4">
        <h2 className="text-xl font-bold mb-4 text-accent">Info Panel</h2>
        <p className="text-text-secondary text-sm">
          Select a character or location on the map to view information
        </p>
      </div>
    );
  }
  
  // Check if character has position data
  if (!selectedCharacter.position) {
    return (
      <div className="h-full bg-panel-bg border-l border-panel-border p-4">
        <h2 className="text-xl font-bold mb-4 text-accent">Character Info</h2>
        <p className="text-text-secondary text-sm">
          Character data incomplete. Position information missing.
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
              <div>
                <div className="text-text-secondary">Position</div>
                <div className="font-semibold">
                  ({selectedCharacter.position.x.toFixed(1)}, {selectedCharacter.position.y.toFixed(1)})
                </div>
              </div>
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
                <div>Nature: {selectedCharacter.madraCore?.nature || 'N/A'}</div>
                <div>
                  Capacity: {selectedCharacter.madraCore?.currentMadra || 0}/
                  {selectedCharacter.madraCore?.maxMadra || 0}
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
            
            {/* Equipment (Weapons & Armor) */}
            {selectedCharacter.inventory.some(i => ['weapon', 'armor'].includes(i.type)) && (
              <div>
                <h4 className="font-semibold mb-2">Equipment</h4>
                <div className="space-y-2">
                  {selectedCharacter.inventory
                    .filter(i => ['weapon', 'armor'].includes(i.type))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-panel-border rounded text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-text-secondary text-xs capitalize">
                            {item.type}
                          </span>
                        </div>
                        {item.description && (
                          <div className="text-text-secondary text-xs mt-1">
                            {item.description}
                          </div>
                        )}
                        {item.quantity > 1 && (
                          <div className="text-text-secondary text-xs">
                            Quantity: {item.quantity}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Other Items (Consumables, Quest Items, etc.) */}
            {selectedCharacter.inventory.some(i => !['weapon', 'armor'].includes(i.type)) && (
              <div>
                <h4 className="font-semibold mb-2">Other Items</h4>
                <div className="space-y-1 text-sm">
                  {selectedCharacter.inventory
                    .filter(i => !['weapon', 'armor'].includes(i.type))
                    .map((item) => (
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
