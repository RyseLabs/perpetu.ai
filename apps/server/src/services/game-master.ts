import { AIClient, GAME_MASTER_SYSTEM_PROMPT, PLAYER_CHARACTER_CREATION_PROMPT, generatePlayerCharacterPrompt, generateGameMasterPrompt } from '@perpetu-ai/ai';
import { Character } from '@perpetu-ai/models';
import { fileStorage } from '../storage.js';
import { config } from '../config.js';

// Counter for unique IDs
let idCounter = 0;

/**
 * Generate a unique character ID
 */
function generateUniqueCharacterId(): string {
  return `char-${Date.now()}-${++idCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

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
    
    // Generate avatar for player character
    let avatarUrl: string | undefined;
    try {
      console.log(`Generating avatar for player character ${characterData.name}...`);
      const avatarPrompt = `Fantasy RPG player character portrait: ${characterData.name}. ${characterData.description || 'A heroic adventurer'}. Heroic fantasy art style, detailed face portrait, ${characterData.advancementTier} tier cultivator, protagonist, dramatic lighting, high quality.`;
      avatarUrl = await this.aiClient.generateImage(avatarPrompt, '256x256');
      console.log(`Avatar generated for player character`);
    } catch (error) {
      console.warn(`Failed to generate avatar for player character:`, error);
      // Continue without avatar
    }
    
    // Create character in file storage
    const now = Date.now();
    const characterId = generateUniqueCharacterId();
    
    // Ensure position is valid - if AI didn't generate one, pick a random starting location
    if (!characterData.position || typeof characterData.position.x !== 'number' || typeof characterData.position.y !== 'number') {
      console.warn('AI did not generate valid position for player character, selecting starting location');
      
      // Try to use first location if available
      if (world.map.locations && world.map.locations.length > 0) {
        const startLocation = world.map.locations[0];
        characterData.position = { 
          x: startLocation.position.x + (Math.random() - 0.5) * 2, // Slight offset
          y: startLocation.position.y + (Math.random() - 0.5) * 2
        };
        console.log(`Placed player character at ${startLocation.name}`);
      } else {
        // Fallback to center of map
        characterData.position = { x: 50, y: 50 };
        console.log('Placed player character at map center');
      }
    }
    
    const character: Character = {
      ...characterData,
      id: characterId,
      avatarUrl,
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
