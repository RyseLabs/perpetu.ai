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
  const { selectedCharacter, selectedLocation, characters, setSelectedCharacter } = useGameStore();
  
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
    
    // Find characters at this location (within 3 units)
    const LOCATION_RADIUS = 3;
    const charactersAtLocation = characters.filter(c => {
      if (!c.position || !selectedLocation.position) return false;
      const dist = calculateDistance(
        c.position.x,
        c.position.y,
        selectedLocation.position.x,
        selectedLocation.position.y
      );
      return dist <= LOCATION_RADIUS;
    });
    
    return (
      <div className="h-full bg-panel-bg p-4 overflow-y-auto">
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
                    onClick={() => setSelectedCharacter(character)}
                    className="p-2 bg-panel-border rounded text-sm cursor-pointer hover:bg-accent-dark transition-colors flex items-center gap-2"
                  >
                    {character.avatarUrl && (
                      <img
                        src={character.avatarUrl}
                        alt={character.name || 'Unknown'}
                        className="w-10 h-10 rounded-full object-cover border border-accent"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">
                        {character.discoveredByPlayer ? character.name : 'Unknown'}
                      </div>
                      <div className="text-text-secondary text-xs">
                        {character.advancementTier}
                      </div>
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
      <div className="h-full bg-panel-bg p-4">
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
      <div className="h-full bg-panel-bg p-4">
        <h2 className="text-xl font-bold mb-4 text-accent">Character Info</h2>
        <p className="text-text-secondary text-sm">
          Character data incomplete. Position information missing.
        </p>
      </div>
    );
  }
  
  const { discoveredByPlayer } = selectedCharacter;
  
  return (
    <div className="h-full bg-panel-bg p-6 overflow-y-auto">
      <div className="mb-4 pb-3 border-b-2 border-accent">
        <h2 className="text-2xl font-bold text-accent">👤 Character Info</h2>
      </div>
      
      <div className="space-y-6">
        {/* Avatar */}
        {selectedCharacter.avatarUrl && discoveredByPlayer && (
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src={selectedCharacter.avatarUrl} 
                alt={selectedCharacter.name}
                className="w-40 h-40 rounded-lg border-4 border-accent object-cover shadow-xl"
              />
              {selectedCharacter.isPlayerCharacter && (
                <div className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">
                  Player
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Basic Info */}
        <div className="bg-panel-border p-4 rounded-lg">
          <h3 className="font-bold text-xl mb-2">
            {discoveredByPlayer ? selectedCharacter.name : 'Unknown Character'}
          </h3>
          {discoveredByPlayer && selectedCharacter.description && (
            <p className="text-sm text-text-secondary leading-relaxed mt-2">{selectedCharacter.description}</p>
          )}
        </div>
        
        {discoveredByPlayer ? (
          <>
            {/* Advancement & Faction */}
            <div className="bg-panel-border p-4 rounded-lg">
              <h4 className="font-semibold text-accent mb-3">Overview</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-panel-bg p-3 rounded">
                  <div className="text-text-secondary text-xs mb-1">Tier</div>
                  <div className="font-semibold text-base">{selectedCharacter.advancementTier}</div>
                </div>
                {selectedCharacter.faction && (
                  <div className="bg-panel-bg p-3 rounded">
                    <div className="text-text-secondary text-xs mb-1">Faction</div>
                    <div className="font-semibold text-base">{selectedCharacter.faction}</div>
                  </div>
                )}
                <div className="bg-panel-bg p-3 rounded col-span-2">
                  <div className="text-text-secondary text-xs mb-1">Position</div>
                  <div className="font-semibold text-base">
                    ({selectedCharacter.position.x.toFixed(1)}, {selectedCharacter.position.y.toFixed(1)})
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            {selectedCharacter.stats ? (
              <div className="bg-panel-border p-4 rounded-lg">
                <h4 className="font-semibold text-accent mb-3">Stats</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-panel-bg p-3 rounded">
                    <div className="text-text-secondary text-xs mb-1">HP</div>
                    <div className="font-semibold text-base">{selectedCharacter.stats.currentHp ?? 0}/{selectedCharacter.stats.maxHp ?? 0}</div>
                  </div>
                  <div className="bg-panel-bg p-3 rounded">
                    <div className="text-text-secondary text-xs mb-1">AC</div>
                    <div className="font-semibold text-base">{selectedCharacter.stats.armorClass ?? 0}</div>
                  </div>
                  <div className="bg-panel-bg p-2 rounded">
                    <div className="text-text-secondary text-xs">STR</div>
                    <div className="font-semibold">{selectedCharacter.stats.strength ?? 0}</div>
                  </div>
                  <div className="bg-panel-bg p-2 rounded">
                    <div className="text-text-secondary text-xs">DEX</div>
                    <div className="font-semibold">{selectedCharacter.stats.dexterity ?? 0}</div>
                  </div>
                  <div className="bg-panel-bg p-2 rounded">
                    <div className="text-text-secondary text-xs">CON</div>
                    <div className="font-semibold">{selectedCharacter.stats.constitution ?? 0}</div>
                  </div>
                  <div className="bg-panel-bg p-2 rounded">
                    <div className="text-text-secondary text-xs">INT</div>
                    <div className="font-semibold">{selectedCharacter.stats.intelligence ?? 0}</div>
                  </div>
                  <div className="bg-panel-bg p-2 rounded">
                    <div className="text-text-secondary text-xs">WIS</div>
                    <div className="font-semibold">{selectedCharacter.stats.wisdom ?? 0}</div>
                  </div>
                  <div className="bg-panel-bg p-2 rounded">
                    <div className="text-text-secondary text-xs">CHA</div>
                    <div className="font-semibold">{selectedCharacter.stats.charisma ?? 0}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-panel-border p-4 rounded-lg">
                <h4 className="font-semibold text-accent mb-2">Stats</h4>
                <div className="text-sm text-text-secondary">Stats data not available</div>
              </div>
            )}
            
            {/* Madra Core */}
            <div className="bg-panel-border p-4 rounded-lg">
              <h4 className="font-semibold text-accent mb-3">Madra Core</h4>
              <div className="space-y-2">
                <div className="bg-panel-bg p-3 rounded">
                  <div className="text-text-secondary text-xs mb-1">Nature</div>
                  <div className="font-semibold text-base">{selectedCharacter.madraCore?.nature || 'N/A'}</div>
                </div>
                <div className="bg-panel-bg p-3 rounded">
                  <div className="text-text-secondary text-xs mb-1">Capacity</div>
                  <div className="font-semibold text-base">
                    {selectedCharacter.madraCore?.currentMadra || 0}/{selectedCharacter.madraCore?.maxMadra || 0}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Activity */}
            <div className="bg-panel-border p-4 rounded-lg">
              <h4 className="font-semibold text-accent mb-3">Current Activity</h4>
              <div className="bg-panel-bg p-3 rounded">
                <div className="capitalize font-semibold">{selectedCharacter.activity}</div>
                {selectedCharacter.currentGoal && (
                  <div className="text-text-secondary text-sm mt-2">
                    <span className="font-semibold">Goal:</span> {selectedCharacter.currentGoal}
                  </div>
                )}
              </div>
            </div>
            
            {/* Techniques */}
            {selectedCharacter.techniques && selectedCharacter.techniques.length > 0 && (
              <div className="bg-panel-border p-4 rounded-lg">
                <h4 className="font-semibold text-accent mb-3">Techniques ({selectedCharacter.techniques.length})</h4>
                <div className="space-y-2">
                  {selectedCharacter.techniques.map((technique) => (
                    <div
                      key={technique.id}
                      className="p-3 bg-panel-bg rounded"
                    >
                      <div className="font-semibold text-base mb-1">{technique.name || 'Unknown Technique'}</div>
                      <div className="text-text-secondary text-xs">
                        {technique.nature || 'Unknown'} • Cost: {technique.madraCost || 0} • Tier: {technique.requiredTier || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Equipment (Weapons & Armor) */}
            {selectedCharacter.inventory && selectedCharacter.inventory.some(i => ['weapon', 'armor'].includes(i.type)) && (
              <div className="bg-panel-border p-4 rounded-lg">
                <h4 className="font-semibold text-accent mb-3">Equipment</h4>
                <div className="space-y-2">
                  {selectedCharacter.inventory
                    .filter(i => ['weapon', 'armor'].includes(i.type))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-panel-bg rounded"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-base">{item.name || 'Unknown Item'}</span>
                          <span className="text-text-secondary text-xs capitalize bg-accent px-2 py-1 rounded">
                            {item.type || 'item'}
                          </span>
                        </div>
                        {item.description && (
                          <div className="text-text-secondary text-sm mt-2">
                            {item.description}
                          </div>
                        )}
                        {item.quantity > 1 && (
                          <div className="text-text-secondary text-xs mt-1">
                            Quantity: {item.quantity}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Other Items (Consumables, Quest Items, etc.) */}
            {selectedCharacter.inventory && selectedCharacter.inventory.some(i => !['weapon', 'armor'].includes(i.type)) && (
              <div className="bg-panel-border p-4 rounded-lg">
                <h4 className="font-semibold text-accent mb-3">Other Items</h4>
                <div className="space-y-2">
                  {selectedCharacter.inventory
                    .filter(i => !['weapon', 'armor'].includes(i.type))
                    .map((item) => (
                      <div key={item.id} className="flex justify-between bg-panel-bg p-2 rounded">
                        <span className="text-sm">{item.name || 'Unknown Item'}</span>
                        <span className="text-text-secondary text-sm">x{item.quantity || 1}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-panel-border p-4 rounded-lg text-center">
            <div className="text-text-secondary">
              <p className="text-4xl mb-4">🔒</p>
              <p>You haven't discovered this character yet.</p>
              <p className="text-sm mt-2">Interact with them to learn more.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
