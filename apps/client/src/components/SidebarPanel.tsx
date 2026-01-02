import React, { useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { AddObjectModal } from './AddObjectModal';
import { EditObjectModal } from './EditObjectModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { Character, Location } from '@perpetu-ai/models';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<Character | Location | null>(null);
  const [editingType, setEditingType] = useState<'character' | 'location'>('character');
  const [deletingObject, setDeletingObject] = useState<{ id: string; name: string; type: 'character' | 'location' } | null>(null);

  const isDraggingRef = useRef(false);

  const {
    characters,
    world,
    selectedCharacter,
    selectedLocation,
    setSelectedCharacter,
    setSelectedLocation,
    deleteCharacter,
    deleteLocation,
  } = useGameStore();

  const handleDragStart = (e: React.DragEvent, data: DragData) => {
    isDraggingRef.current = true;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(data));
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 0);
  };

  const handleClick =
      (entityType: string, entityName: string, callback: () => void) =>
          (e: React.MouseEvent) => {
            e.stopPropagation();

            console.log(`[SidebarPanel] Click event on ${entityType}: ${entityName}`);
            console.log(`[SidebarPanel] isDragging:`, isDraggingRef.current);

            if (isDraggingRef.current) {
              console.log(`[SidebarPanel] Click ignored - was a drag`);
              return;
            }

            console.log(`[SidebarPanel] Executing callback for ${entityType}: ${entityName}`);
            callback();
          };

  const handleEdit = (object: Character | Location, type: 'character' | 'location') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingObject(object);
    setEditingType(type);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string, name: string, type: 'character' | 'location') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingObject({ id, name, type });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingObject) return;

    const API_BASE = 'http://localhost:3000/api';

    // Check if world exists
    if (!world || !world.id) {
      alert('No world selected. Please select or create a world first.');
      return;
    }

    try {
      if (deletingObject.type === 'character') {
        const response = await fetch(
          `${API_BASE}/worlds/${world.id}/characters/${deletingObject.id}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete character failed:', response.status, errorData);
          throw new Error(errorData.message || 'Failed to delete character');
        }

        deleteCharacter(deletingObject.id);
      } else {
        const response = await fetch(
          `${API_BASE}/worlds/${world.id}/locations/${deletingObject.id}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete location failed:', response.status, errorData);
          throw new Error(errorData.message || 'Failed to delete location');
        }

        deleteLocation(deletingObject.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const partyMembers = characters.filter((char) => char.isInPlayerParty);
  const npcs = characters.filter((char) => !char.isInPlayerParty);
  const locations = world?.map?.locations || [];

  return (
      <div className="h-full bg-panel-bg border-r border-panel-border flex flex-col relative">
        <AddObjectModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        <EditObjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          object={editingObject}
          objectType={editingType}
        />
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          itemName={deletingObject?.name || ''}
          itemType={deletingObject?.type || 'character'}
        />

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

        <div className="flex-1 overflow-y-auto p-4">
          <button
              onClick={() => setIsAddModalOpen(true)}
              className="fixed z-10 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold hover:bg-accent-dark transition-colors shadow-lg hover:scale-110"
              title="Add new character or location"
              style={{ bottom: '1rem', left: 'calc(320px - 3rem - 1rem)' }}
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
                            <div
                                key={character.id}
                                className="relative group"
                            >
                              <button
                                  draggable
                                  onDragStart={(e) =>
                                      handleDragStart(e, {
                                        type: 'character',
                                        id: character.id,
                                        name: name,
                                      })
                                  }
                                  onDragEnd={handleDragEnd}
                                  onClick={handleClick('party member', name, () => {
                                    setSelectedCharacter(character);
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
                              
                              {/* Edit/Delete icons */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={handleEdit(character, 'character')}
                                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                  title="Edit character"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={handleDelete(character.id, name, 'character')}
                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                  title="Delete character"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
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
                            <div
                                key={character.id}
                                className="relative group"
                            >
                              <button
                                  draggable
                                  onDragStart={(e) =>
                                      handleDragStart(e, {
                                        type: 'character',
                                        id: character.id,
                                        name: name,
                                      })
                                  }
                                  onDragEnd={handleDragEnd}
                                  onClick={handleClick('NPC', name, () => {
                                    setSelectedCharacter(character);
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
                              
                              {/* Edit/Delete icons */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={handleEdit(character, 'character')}
                                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                  title="Edit character"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={handleDelete(character.id, name, 'character')}
                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                  title="Delete character"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
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
                      {locations
                          .filter((loc) => loc.discoveredByPlayer)
                          .map((location) => {
                            const name = location.name || 'Unknown Location';
                            const type = location.type || 'Unknown';

                            return (
                                <div
                                    key={location.id}
                                    className="relative group"
                                >
                                  <button
                                      draggable
                                      onDragStart={(e) =>
                                          handleDragStart(e, {
                                            type: 'location',
                                            id: location.id,
                                            name: name,
                                          })
                                      }
                                      onDragEnd={handleDragEnd}
                                      onClick={handleClick('location', name, () => {
                                        setSelectedLocation(location);
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
                                  
                                  {/* Edit/Delete icons */}
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={handleEdit(location, 'location')}
                                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                      title="Edit location"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={handleDelete(location.id, name, 'location')}
                                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                      title="Delete location"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
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
