import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { World, Character, WorldEvent, ChatMessage } from '@perpetu-ai/models';
import { v4 as uuidv4 } from 'uuid';

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
 * Download image from URL and save with GUID filename
 */
async function downloadImage(url: string, savePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const guid = uuidv4();
      const ext = path.extname(new URL(url).pathname) || '.png';
      const filename = `${guid}${ext}`;
      const filepath = path.join(savePath, filename);
      
      const fileStream = require('fs').createWriteStream(filepath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filename);
      });
      
      fileStream.on('error', (err: Error) => {
        fs.unlink(filepath).catch(() => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Simple file-based storage for game state
 * Each world gets its own directory structure
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
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }
  
  /**
   * Get world-specific directory path
   */
  private getWorldDir(worldId: string): string {
    return path.join(this.dataDir, 'saves', worldId);
  }
  
  /**
   * Initialize world-specific directories
   */
  private async initWorldDir(worldId: string): Promise<void> {
    const worldDir = this.getWorldDir(worldId);
    await fs.mkdir(worldDir, { recursive: true });
    await fs.mkdir(path.join(worldDir, 'characters'), { recursive: true });
    await fs.mkdir(path.join(worldDir, 'events'), { recursive: true });
    await fs.mkdir(path.join(worldDir, 'images'), { recursive: true });
  }
  
  /**
   * Download and store image locally, return local filename
   */
  async downloadAndStoreImage(worldId: string, imageUrl: string): Promise<string> {
    const worldDir = this.getWorldDir(worldId);
    const imagesDir = path.join(worldDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });
    
    try {
      const filename = await downloadImage(imageUrl, imagesDir);
      return filename;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw error;
    }
  }
  
  /**
   * Get local image path
   */
  getImagePath(worldId: string, filename: string): string {
    return path.join(this.getWorldDir(worldId), 'images', filename);
  }
  
  /**
   * Save world to its own directory
   */
  async saveWorld(world: World): Promise<void> {
    await this.initWorldDir(world.id);
    const filePath = path.join(this.getWorldDir(world.id), 'world.json');
    await fs.writeFile(filePath, JSON.stringify(world, null, 2), 'utf-8');
  }
  
  /**
   * Get world by ID
   */
  async getWorld(worldId: string): Promise<World | null> {
    try {
      const filePath = path.join(this.getWorldDir(worldId), 'world.json');
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
      const savesDir = path.join(this.dataDir, 'saves');
      await fs.mkdir(savesDir, { recursive: true });
      const worldDirs = await fs.readdir(savesDir);
      const worlds: World[] = [];
      
      for (const worldDir of worldDirs) {
        try {
          const worldFile = path.join(savesDir, worldDir, 'world.json');
          const data = await fs.readFile(worldFile, 'utf-8');
          worlds.push(JSON.parse(data) as World);
        } catch (error) {
          // Skip invalid world directories
          console.warn(`Skipping invalid world directory: ${worldDir}`);
        }
      }
      
      return worlds;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Delete world and all its data
   */
  async deleteWorld(worldId: string): Promise<void> {
    const worldDir = this.getWorldDir(worldId);
    try {
      await fs.rm(worldDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete world ${worldId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save character to world directory
   */
  async saveCharacter(worldId: string, character: Character): Promise<void> {
    const worldDir = path.join(this.getWorldDir(worldId), 'characters');
    await fs.mkdir(worldDir, { recursive: true });
    const filePath = path.join(worldDir, `${character.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(character, null, 2), 'utf-8');
  }
  
  /**
   * Get character by ID
   */
  async getCharacter(worldId: string, characterId: string): Promise<Character | null> {
    try {
      const filePath = path.join(this.getWorldDir(worldId), 'characters', `${characterId}.json`);
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
      const worldDir = path.join(this.getWorldDir(worldId), 'characters');
      await fs.mkdir(worldDir, { recursive: true });
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
    const worldDir = path.join(this.getWorldDir(worldId), 'events');
    await fs.mkdir(worldDir, { recursive: true });
    const filePath = path.join(worldDir, `${event.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(event, null, 2), 'utf-8');
  }
  
  /**
   * Get world events
   */
  async getWorldEvents(worldId: string): Promise<WorldEvent[]> {
    try {
      const worldDir = path.join(this.getWorldDir(worldId), 'events');
      await fs.mkdir(worldDir, { recursive: true });
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
   * Save chat message to world's chat history
   */
  async saveChatMessage(worldId: string, message: ChatMessage): Promise<void> {
    const chatFile = path.join(this.getWorldDir(worldId), 'chat.json');
    await fs.mkdir(this.getWorldDir(worldId), { recursive: true });
    
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
      const chatFile = path.join(this.getWorldDir(worldId), 'chat.json');
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
