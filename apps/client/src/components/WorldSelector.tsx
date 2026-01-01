import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * World selector dropdown for loading existing worlds or starting a new game
 */
export const WorldSelector: React.FC = () => {
  const {
    world,
    availableWorlds,
    setWorld,
    setCharacters,
    clearChatMessages,
    addChatMessage,
    setAvailableWorlds,
    setLoadingWorld,
    setLoadingWorlds,
    isLoadingWorlds,
  } = useGameStore();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch available worlds on mount
  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        setLoadingWorlds(true);
        const response = await fetch('/api/worlds');
        if (response.ok) {
          const data = await response.json();
          setAvailableWorlds(
            data.worlds.map((w: any) => ({
              id: w.id,
              name: w.name,
              createdAt: w.createdAt,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch worlds:', error);
      } finally {
        setLoadingWorlds(false);
      }
    };
    
    fetchWorlds();
  }, [setAvailableWorlds, setLoadingWorlds]);
  
  const loadWorld = async (worldId: string) => {
    try {
      setLoadingWorld(true);
      setIsOpen(false);
      
      // Fetch world data
      const worldResponse = await fetch(`/api/worlds/${worldId}`);
      if (!worldResponse.ok) throw new Error('Failed to load world');
      
      const worldData = await worldResponse.json();
      setWorld(worldData.world);
      
      // Fetch characters
      const charsResponse = await fetch(`/api/worlds/${worldId}/characters`);
      if (charsResponse.ok) {
        const charsData = await charsResponse.json();
        setCharacters(charsData.characters);
      }
      
      // Set up chat
      clearChatMessages();
      addChatMessage('gm', `Welcome back to ${worldData.world.name}!`);
      addChatMessage('gm', 'What would you like to do?');
      
    } catch (error) {
      console.error('Failed to load world:', error);
      addChatMessage('system', '❌ Failed to load world. Please try again.');
    } finally {
      setLoadingWorld(false);
    }
  };
  
  const startNewGame = () => {
    setIsOpen(false);
    // Reset state for new game
    setWorld(null);
    setCharacters([]);
    clearChatMessages();
  };
  
  const deleteWorld = async (worldId: string, worldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${worldName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/worlds/${worldId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from available worlds
        setAvailableWorlds(availableWorlds.filter(w => w.id !== worldId));
        
        // If deleted world was loaded, reset
        if (world?.id === worldId) {
          startNewGame();
        }
        
        addChatMessage('system', `✓ World "${worldName}" deleted successfully`);
      } else {
        throw new Error('Failed to delete world');
      }
    } catch (error) {
      console.error('Failed to delete world:', error);
      addChatMessage('system', `❌ Failed to delete world. Please try again.`);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-panel-border rounded hover:bg-accent/20 transition-colors text-sm"
        disabled={isLoadingWorlds}
      >
        <span>{world ? world.name : 'Select World'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-panel-bg border border-panel-border rounded shadow-lg z-20 max-h-80 overflow-y-auto">
            {/* New Game Option */}
            <button
              onClick={startNewGame}
              className="w-full px-4 py-2 text-left hover:bg-accent/20 transition-colors border-b border-panel-border flex items-center gap-2"
            >
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <div>
                <div className="font-semibold text-accent">New Game</div>
                <div className="text-xs text-text-secondary">Start a new world</div>
              </div>
            </button>
            
            {/* Existing Worlds */}
            {availableWorlds.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-secondary">
                No saved worlds yet
              </div>
            ) : (
              availableWorlds.map((w) => (
                <div
                  key={w.id}
                  className={`w-full flex items-center border-b border-panel-border last:border-b-0 ${
                    world?.id === w.id ? 'bg-accent/10' : ''
                  }`}
                >
                  <button
                    onClick={() => loadWorld(w.id)}
                    className="flex-1 px-4 py-2 text-left hover:bg-accent/20 transition-colors"
                  >
                    <div className="font-semibold">{w.name}</div>
                    <div className="text-xs text-text-secondary">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    onClick={(e) => deleteWorld(w.id, w.name, e)}
                    className="px-3 py-2 hover:bg-red-500/20 text-red-500 transition-colors"
                    title="Delete world"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
