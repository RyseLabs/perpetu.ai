import { AIClient, PLAYER_CHARACTER_CREATION_PROMPT, generatePlayerCharacterPrompt, generateGameMasterPrompt, generateGameMasterSystemPromptWithState } from '@perpetu-ai/ai';
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
  ): Promise<{ narrative: string; updatedCharacters: Character[] }> {
    console.log('Processing player message...');
    
    // Save player message to chat history
    await fileStorage.saveChatMessage(worldId, {
      id: `msg-${Date.now()}-player-${Math.random().toString(36).substr(2, 9)}`,
      sender: 'player',
      content: playerMessage,
      timestamp: Date.now(),
    });
    
    const world = await fileStorage.getWorld(worldId);
    if (!world) {
      throw new Error('World not found');
    }
    
    const characters = await fileStorage.getWorldCharacters(worldId);
    
    // Generate GM response using AI with game state in system prompt
    const systemPrompt = generateGameMasterSystemPromptWithState(world, characters);
    const userPrompt = generateGameMasterPrompt(world, characters, playerMessage, chatHistory);
    
    const response = await this.aiClient.generateText(
      systemPrompt,
      userPrompt,
      0.8
    );
    
    console.log('GM response generated');
    
    // Parse and apply state updates
    const { narrative, updatedCharacters } = await this.parseAndApplyStateUpdates(
      worldId,
      response,
      characters
    );
    
    // Save GM response to chat history
    await fileStorage.saveChatMessage(worldId, {
      id: `msg-${Date.now()}-gm-${Math.random().toString(36).substr(2, 9)}`,
      sender: 'gm',
      content: narrative,
      timestamp: Date.now(),
    });
    
    return { narrative, updatedCharacters };
  }
  
  /**
   * Parse state updates from GM response and apply them
   */
  private async parseAndApplyStateUpdates(
    worldId: string,
    response: string,
    characters: Character[]
  ): Promise<{ narrative: string; updatedCharacters: Character[] }> {
    // Extract JSON code blocks from response
    const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
    const matches = [...response.matchAll(jsonBlockRegex)];
    
    // Remove JSON blocks from narrative to show clean text to user
    let narrative = response;
    matches.forEach(match => {
      narrative = narrative.replace(match[0], '').trim();
    });
    
    // Also remove "**State Update:**" markers if present
    narrative = narrative.replace(/\*\*State Update:\*\*/gi, '').trim();
    
    const updatedCharacters: Character[] = [];
    
    // Parse and apply state updates from last JSON block
    if (matches.length > 0) {
      try {
        const stateUpdates = JSON.parse(matches[matches.length - 1][1]);
        console.log('State updates parsed:', JSON.stringify(stateUpdates, null, 2));
        
        if (stateUpdates.characterUpdates && Array.isArray(stateUpdates.characterUpdates)) {
          for (const update of stateUpdates.characterUpdates) {
            const character = characters.find(c => c.id === update.characterId);
            if (!character) {
              console.warn(`Character not found: ${update.characterId}`);
              continue;
            }
            
            // Apply updates to character
            let hasChanges = false;
            
            if (update.updates.position) {
              character.position = update.updates.position;
              hasChanges = true;
              console.log(`Updated position for ${character.name}:`, character.position);
            }
            
            if (update.updates.stats) {
              character.stats = { ...character.stats, ...update.updates.stats };
              hasChanges = true;
              console.log(`Updated stats for ${character.name}`);
            }
            
            if (update.updates.madraCore) {
              character.madraCore = { ...character.madraCore, ...update.updates.madraCore };
              hasChanges = true;
              console.log(`Updated madra for ${character.name}`);
            }
            
            if (update.updates.inventory) {
              character.inventory = update.updates.inventory;
              hasChanges = true;
              console.log(`Updated inventory for ${character.name}`);
            }
            
            if (update.updates.activity) {
              character.activity = update.updates.activity;
              hasChanges = true;
            }
            
            if (update.updates.currentGoal) {
              character.currentGoal = update.updates.currentGoal;
              hasChanges = true;
            }
            
            if (hasChanges) {
              character.lastUpdated = Date.now();
              await fileStorage.saveCharacter(worldId, character);
              updatedCharacters.push(character);
              console.log(`Saved updates for ${character.name}`);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse or apply state updates:', error);
      }
    }
    
    return { narrative, updatedCharacters };
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
