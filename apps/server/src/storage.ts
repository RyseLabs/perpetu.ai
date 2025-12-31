import { promises as fs } from 'fs';
import path from 'path';
import { World, Character, WorldEvent, ChatMessage } from '@perpetu-ai/models';

/**
 * Type guard to check if error is a Node.js error with code
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  );
}

/**
 * Simple file-based storage for game state
 * Stores data in JSON files in the ./data directory
 */
export class FileStorage {
  private dataDir: string;
  
  constructor(dataDir: string = './data') {
    this.dataDir = path.resolve(dataDir);
  }
  
  /**
   * Initialize storage directory
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'worlds'), { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'characters'), { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'events'), { recursive: true });
      await fs.mkdir(path.join(this.dataDir, 'chat'), { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }
  
  /**
   * Save world to file
   */
  async saveWorld(world: World): Promise<void> {
    const filePath = path.join(this.dataDir, 'worlds', `${world.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(world, null, 2), 'utf-8');
  }
  
  /**
   * Get world by ID
   */
  async getWorld(worldId: string): Promise<World | null> {
    try {
      const filePath = path.join(this.dataDir, 'worlds', `${worldId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as World;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
  
  /**
   * List all worlds
   */
  async listWorlds(): Promise<World[]> {
    try {
      const worldsDir = path.join(this.dataDir, 'worlds');
      const files = await fs.readdir(worldsDir);
      const worlds: World[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(worldsDir, file), 'utf-8');
          worlds.push(JSON.parse(data) as World);
        }
      }
      
      return worlds;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Save character to file
   */
  async saveCharacter(worldId: string, character: Character): Promise<void> {
    const worldDir = path.join(this.dataDir, 'characters', worldId);
    await fs.mkdir(worldDir, { recursive: true });
    const filePath = path.join(worldDir, `${character.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(character, null, 2), 'utf-8');
  }
  
  /**
   * Get character by ID
   */
  async getCharacter(worldId: string, characterId: string): Promise<Character | null> {
    try {
      const filePath = path.join(this.dataDir, 'characters', worldId, `${characterId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as Character;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Get all characters in a world
   */
  async getWorldCharacters(worldId: string): Promise<Character[]> {
    try {
      const worldDir = path.join(this.dataDir, 'characters', worldId);
      const files = await fs.readdir(worldDir);
      const characters: Character[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(worldDir, file), 'utf-8');
          characters.push(JSON.parse(data) as Character);
        }
      }
      
      return characters;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
  
  /**
   * Update character
   */
  async updateCharacter(worldId: string, characterId: string, updates: Partial<Character>): Promise<void> {
    const character = await this.getCharacter(worldId, characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }
    
    const updated = {
      ...character,
      ...updates,
      lastUpdated: Date.now(),
    };
    
    await this.saveCharacter(worldId, updated);
  }
  
  /**
   * Save event to file
   */
  async saveEvent(worldId: string, event: WorldEvent): Promise<void> {
    const worldDir = path.join(this.dataDir, 'events', worldId);
    await fs.mkdir(worldDir, { recursive: true });
    const filePath = path.join(worldDir, `${event.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(event, null, 2), 'utf-8');
  }
  
  /**
   * Get world events
   */
  async getWorldEvents(worldId: string): Promise<WorldEvent[]> {
    try {
      const worldDir = path.join(this.dataDir, 'events', worldId);
      const files = await fs.readdir(worldDir);
      const events: WorldEvent[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(worldDir, file), 'utf-8');
          events.push(JSON.parse(data) as WorldEvent);
        }
      }
      
      return events.sort((a, b) => a.turn - b.turn);
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
  
  /**
   * Delete world and all associated data
   */
  async deleteWorld(worldId: string): Promise<void> {
    const worldFile = path.join(this.dataDir, 'worlds', `${worldId}.json`);
    const charactersDir = path.join(this.dataDir, 'characters', worldId);
    const eventsDir = path.join(this.dataDir, 'events', worldId);
    
    try {
      await fs.unlink(worldFile);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    
    try {
      await fs.rm(charactersDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    
    try {
      await fs.rm(eventsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }
  
  /**
   * Save chat message to world's chat history
   */
  async saveChatMessage(worldId: string, message: ChatMessage): Promise<void> {
    const chatFile = path.join(this.dataDir, 'chat', `${worldId}.json`);
    await fs.mkdir(path.join(this.dataDir, 'chat'), { recursive: true });
    
    // Load existing messages
    let messages: ChatMessage[] = [];
    try {
      const data = await fs.readFile(chatFile, 'utf-8');
      messages = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }
    
    // Append new message
    messages.push(message);
    
    // Save updated history
    await fs.writeFile(chatFile, JSON.stringify(messages, null, 2), 'utf-8');
  }
  
  /**
   * Get all chat messages for a world
   */
  async getWorldChat(worldId: string): Promise<ChatMessage[]> {
    try {
      const chatFile = path.join(this.dataDir, 'chat', `${worldId}.json`);
      const data = await fs.readFile(chatFile, 'utf-8');
      return JSON.parse(data) as ChatMessage[];
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return []; // No chat history yet
      }
      throw error;
    }
  }
}

// Singleton instance
export const fileStorage = new FileStorage();
