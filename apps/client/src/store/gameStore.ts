import { create } from 'zustand';
import type { World, Character, WorldEvent } from '@perpetu-ai/models';

interface GameState {
  // World state
  world: World | null;
  characters: Character[];
  events: WorldEvent[];
  
  // Selected character for info panel
  selectedCharacter: Character | null;
  
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
  
  // Actions
  setWorld: (world: World) => void;
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  setSelectedCharacter: (character: Character | null) => void;
  addChatMessage: (sender: 'player' | 'gm' | 'system', content: string) => void;
  clearChatMessages: () => void;
  addEvent: (event: WorldEvent) => void;
  setConnected: (connected: boolean) => void;
  setWorldBuilding: (isBuilding: boolean, error?: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  world: null,
  characters: [],
  events: [],
  selectedCharacter: null,
  chatMessages: [],
  connected: false,
  isWorldBuilding: false,
  worldBuildingError: null,
  
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
  
  setSelectedCharacter: (character) => set({ selectedCharacter: character }),
  
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
}));
