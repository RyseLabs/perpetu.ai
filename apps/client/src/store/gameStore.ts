import { create } from 'zustand';
import type { World, Character, WorldEvent, Location } from '@perpetu-ai/models';

interface GameState {
  // World state
  world: World | null;
  characters: Character[];
  events: WorldEvent[];
  
  // Available worlds list
  availableWorlds: Array<{ id: string; name: string; createdAt: number }>;
  
  // Selected character for info panel
  selectedCharacter: Character | null;
  
  // Selected location for info panel
  selectedLocation: Location | null;
  
  // Chat messages
  chatMessages: Array<{
    id: string;
    sender: 'player' | 'gm' | 'system';
    content: string;
    timestamp: number;
  }>;
  
  // WebSocket connection
  connected: boolean;
  
  // World building state
  isWorldBuilding: boolean;
  worldBuildingError: string | null;
  
  // Loading states
  isLoadingWorld: boolean;
  isLoadingWorlds: boolean;
  
  // Actions
  setWorld: (world: World | null) => void;
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  setSelectedCharacter: (character: Character | null) => void;
  setSelectedLocation: (location: Location | null) => void;
  addChatMessage: (sender: 'player' | 'gm' | 'system', content: string) => void;
  clearChatMessages: () => void;
  addEvent: (event: WorldEvent) => void;
  setConnected: (connected: boolean) => void;
  setWorldBuilding: (isBuilding: boolean, error?: string | null) => void;
  setAvailableWorlds: (worlds: Array<{ id: string; name: string; createdAt: number }>) => void;
  setLoadingWorld: (isLoading: boolean) => void;
  setLoadingWorlds: (isLoading: boolean) => void;
  addLocation: (location: Location) => void;
}

export const useGameStore = create<GameState>((set) => ({
  world: null,
  characters: [],
  events: [],
  availableWorlds: [],
  selectedCharacter: null,
  selectedLocation: null,
  chatMessages: [],
  connected: false,
  isWorldBuilding: false,
  worldBuildingError: null,
  isLoadingWorld: false,
  isLoadingWorlds: false,
  
  setWorld: (world) => set({ world }),
  
  setCharacters: (characters) => set({ characters }),
  
  addCharacter: (character) =>
    set((state) => ({
      characters: [...state.characters, character],
    })),
  
  updateCharacter: (characterId, updates) =>
    set((state) => ({
      characters: state.characters.map((char) =>
        char.id === characterId ? { ...char, ...updates } : char
      ),
      selectedCharacter:
        state.selectedCharacter?.id === characterId
          ? { ...state.selectedCharacter, ...updates }
          : state.selectedCharacter,
    })),
  
  setSelectedCharacter: (character) => set({ selectedCharacter: character, selectedLocation: null }),
  
  setSelectedLocation: (location) => set({ selectedLocation: location, selectedCharacter: null }),
  
  addChatMessage: (sender, content) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: `msg-${Date.now()}-${Math.random()}`,
          sender,
          content,
          timestamp: Date.now(),
        },
      ],
    })),
  
  clearChatMessages: () => set({ chatMessages: [] }),
  
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),
  
  setConnected: (connected) => set({ connected }),
  
  setWorldBuilding: (isBuilding, error = null) => 
    set({ isWorldBuilding: isBuilding, worldBuildingError: error }),
  
  setAvailableWorlds: (worlds) => set({ availableWorlds: worlds }),
  
  setLoadingWorld: (isLoading) => set({ isLoadingWorld: isLoading }),
  
  setLoadingWorlds: (isLoading) => set({ isLoadingWorlds: isLoading }),
  
  addLocation: (location) =>
    set((state) => ({
      world: state.world
        ? {
            ...state.world,
            map: {
              ...state.world.map,
              locations: [...state.world.map.locations, location],
            },
          }
        : null,
    })),
}));
