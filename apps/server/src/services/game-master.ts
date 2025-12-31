import { AIClient, GAME_MASTER_SYSTEM_PROMPT, PLAYER_CHARACTER_CREATION_PROMPT, generatePlayerCharacterPrompt, generateGameMasterPrompt } from '@perpetu-ai/ai';
import { World, Character } from '@perpetu-ai/models';
import { fileStorage } from '../storage.js';
import { config } from '../config.js';

/**
 * Game Master service for managing gameplay, player characters, and AI narration
 */
export class GameMasterService {
  private aiClient: AIClient;
  
  constructor() {
    this.aiClient = new AIClient(config.openaiApiKey);
  }
  
  /**
   * Create a player character from description
   */
  async createPlayerCharacter(
    worldId: string,
    playerDescription: string
  ): Promise<Character> {
    console.log('Creating player character...');
    
    const world = await fileStorage.getWorld(worldId);
    if (!world) {
      throw new Error('World not found');
    }
    
    // Generate character data using AI
    const characterData = await this.aiClient.generateJSON<
      Omit<Character, 'id' | 'createdAt' | 'lastUpdated'>
    >(
      PLAYER_CHARACTER_CREATION_PROMPT,
      generatePlayerCharacterPrompt(world, playerDescription),
      null,
      0.7
    );
    
    console.log('Player character generated:', characterData.name);
    
    // Create character in file storage
    const now = Date.now();
    const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const character: Character = {
      ...characterData,
      id: characterId,
      createdAt: now,
      lastUpdated: now,
      isPlayerCharacter: true,
      isInPlayerParty: true,
      discoveredByPlayer: true,
    };
    
    await fileStorage.saveCharacter(worldId, character);
    
    console.log(`Created player character "${character.name}" in world "${world.name}"`);
    
    return character;
  }
  
  /**
   * Handle game master response to player message
   */
  async handlePlayerMessage(
    worldId: string,
    playerMessage: string,
    chatHistory: Array<{ sender: string; content: string }>
  ): Promise<string> {
    console.log('Processing player message...');
    
    const world = await fileStorage.getWorld(worldId);
    if (!world) {
      throw new Error('World not found');
    }
    
    const characters = await fileStorage.getWorldCharacters(worldId);
    
    // Generate GM response using AI
    const response = await this.aiClient.generateText(
      GAME_MASTER_SYSTEM_PROMPT,
      generateGameMasterPrompt(world, characters, playerMessage, chatHistory),
      0.8
    );
    
    console.log('GM response generated');
    
    return response;
  }
  
  /**
   * Check if world has a player character
   */
  async hasPlayerCharacter(worldId: string): Promise<boolean> {
    const characters = await fileStorage.getWorldCharacters(worldId);
    return characters.some(c => c.isPlayerCharacter);
  }
  
  /**
   * Get player character for a world
   */
  async getPlayerCharacter(worldId: string): Promise<Character | null> {
    const characters = await fileStorage.getWorldCharacters(worldId);
    return characters.find(c => c.isPlayerCharacter) || null;
  }
}
