import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { AddObjectModal } from './AddObjectModal';

type Tab = 'party' | 'npcs' | 'locations';

interface DragData {
  type: 'character' | 'location';
  id: string;
  name: string;
}

/**
 * Left sidebar panel with tabs for Party, NPCs, and Locations
 */
export const SidebarPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('party');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const { characters, world, selectedCharacter, selectedLocation, setSelectedCharacter, setSelectedLocation } = useGameStore();
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };
  
  const handleDragStart = (e: React.DragEvent, data: DragData) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(data));
  };
  
  const handleDragEnd = () => {
    // Clear drag position after a short delay to ensure click is processed
    setTimeout(() => setDragStartPos(null), 100);
  };
  
  // Handle click - check if this was actually a drag
  const handleClick = (entityType: string, entityName: string, callback: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we have a drag start position, check if mouse moved significantly
    if (dragStartPos) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + 
        Math.pow(e.clientY - dragStartPos.y, 2)
      );
      
      // If moved more than 5 pixels, consider it a drag, not a click
      if (distance > 5) {
        console.log(`[SidebarPanel] Click ignored - was a drag (moved ${distance.toFixed(0)}px)`);
        return;
      }
    }
    
    console.log(`[SidebarPanel] Click detected on ${entityType}: ${entityName}`);
    console.log(`[SidebarPanel] Executing callback for ${entityType}: ${entityName}`);
    callback();
  };
  
  const partyMembers = characters.filter((char) => char.isInPlayerParty);
  const npcs = characters.filter((char) => !char.isInPlayerParty);
  const locations = world?.map?.locations || [];
  
  return (
    <div className="h-full bg-panel-bg border-r border-panel-border flex flex-col relative">
      {/* Add Object Modal */}
      <AddObjectModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      
      {/* Tabs */}
      <div className="flex border-b border-panel-border">
        <button
          onClick={() => setActiveTab('party')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'party'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-panel-border'
          }`}
        >
          Party
        </button>
        <button
          onClick={() => setActiveTab('npcs')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'npcs'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-panel-border'
          }`}
        >
          NPCs
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'locations'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-panel-border'
          }`}
        >
          Locations
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        {/* Add Button - positioned at bottom right of tab content viewport */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-4 right-4 z-10 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold hover:bg-accent-dark transition-colors shadow-lg hover:scale-110"
          title="Add new character or location"
          style={{ position: 'absolute' }}
        >
          +
        </button>
        
        {activeTab === 'party' && (
          <div>
            {partyMembers.length === 0 ? (
              <p className="text-text-secondary text-sm">No party members yet</p>
            ) : (
              <div className="space-y-2">
                {partyMembers.map((character) => {
                  const currentHp = character.stats?.currentHp ?? 0;
                  const maxHp = character.stats?.maxHp ?? 0;
                  const name = character.name || 'Unknown Character';
                  const tier = character.advancementTier || 'Unknown';
                  
                  return (
                    <button
                      key={character.id}
                      draggable
                      onMouseDown={handleMouseDown}
                      onDragStart={(e) => handleDragStart(e, {
                        type: 'character',
                        id: character.id,
                        name: name
                      })}
                      onDragEnd={handleDragEnd}
                      onClick={handleClick('party member', name, () => {
                        setSelectedCharacter(character);
                        setSelectedLocation(null);
                      })}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 cursor-pointer border-2 ${
                        selectedCharacter?.id === character.id
                          ? 'bg-accent text-white border-accent-light shadow-lg'
                          : 'bg-panel-border hover:bg-opacity-50 border-transparent hover:border-accent'
                      }`}
                    >
                      {character.avatarUrl ? (
                        <img 
                          src={character.avatarUrl} 
                          alt={name}
                          className="w-12 h-12 rounded-full border-2 border-accent object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-panel-bg flex items-center justify-center border-2 border-accent flex-shrink-0">
                          <span className="text-lg font-bold">{name[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{name}</div>
                        <div className="text-sm opacity-75 truncate">{tier}</div>
                        <div className="text-xs mt-1">
                          HP: {currentHp}/{maxHp}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'npcs' && (
          <div>
            {npcs.length === 0 ? (
              <p className="text-text-secondary text-sm">No NPCs discovered yet</p>
            ) : (
              <div className="space-y-2">
                {npcs.map((character) => {
                  const name = character.discoveredByPlayer ? (character.name || 'Unknown') : 'Unknown';
                  const tier = character.advancementTier || 'Unknown';
                  
                  return (
                    <button
                      key={character.id}
                      draggable
                      onMouseDown={handleMouseDown}
                      onDragStart={(e) => handleDragStart(e, {
                        type: 'character',
                        id: character.id,
                        name: name
                      })}
                      onDragEnd={handleDragEnd}
                      onClick={handleClick('NPC', name, () => {
                        setSelectedCharacter(character);
                        setSelectedLocation(null);
                      })}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 cursor-pointer border-2 ${
                        selectedCharacter?.id === character.id
                          ? 'bg-accent text-white border-accent-light shadow-lg'
                          : 'bg-panel-border hover:bg-opacity-50 border-transparent hover:border-accent'
                      }`}
                    >
                      {character.avatarUrl && character.discoveredByPlayer ? (
                        <img 
                          src={character.avatarUrl} 
                          alt={name}
                          className="w-12 h-12 rounded-full border-2 border-gold object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-panel-bg flex items-center justify-center border-2 border-gold flex-shrink-0">
                          <span className="text-lg font-bold">?</span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{name}</div>
                        {character.discoveredByPlayer && (
                          <>
                            <div className="text-sm opacity-75 truncate">{tier}</div>
                            {character.faction && (
                              <div className="text-xs opacity-60 truncate">{character.faction}</div>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'locations' && (
          <div>
            {locations.length === 0 ? (
              <p className="text-text-secondary text-sm">No locations discovered yet</p>
            ) : (
              <div className="space-y-2">
                {locations.filter(loc => loc.discoveredByPlayer).map((location) => {
                  const name = location.name || 'Unknown Location';
                  const type = location.type || 'Unknown';
                  
                  return (
                    <button
                      key={location.id}
                      draggable
                      onMouseDown={handleMouseDown}
                      onDragStart={(e) => handleDragStart(e, {
                        type: 'location',
                        id: location.id,
                        name: name
                      })}
                      onDragEnd={handleDragEnd}
                      onClick={handleClick('location', name, () => {
                        setSelectedLocation(location);
                        setSelectedCharacter(null);
                      })}
                      className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer border-2 ${
                        selectedLocation?.id === location.id
                          ? 'bg-accent text-white border-accent-light shadow-lg'
                          : 'bg-panel-border hover:bg-opacity-50 border-transparent hover:border-accent'
                      }`}
                    >
                      <div className="font-semibold truncate">{name}</div>
                      <div className="text-sm opacity-75 capitalize truncate">{type}</div>
                      {location.faction && (
                        <div className="text-xs opacity-60 truncate">{location.faction}</div>
                      )}
                      {location.position && (
                        <div className="text-xs opacity-60 mt-1">
                          ({location.position.x.toFixed(1)}, {location.position.y.toFixed(1)})
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
