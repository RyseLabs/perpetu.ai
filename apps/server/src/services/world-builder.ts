import { AIClient, generateWorldBuilderPrompt, WORLD_BUILDER_SYSTEM_PROMPT } from '@perpetu-ai/ai';
import { World, Character } from '@perpetu-ai/models';
import { fileStorage } from '../storage.js';
import { config } from '../config.js';

/**
 * World Builder service for ingesting story files and generating game worlds
 */
export class WorldBuilderService {
  private aiClient: AIClient;
  
  constructor() {
    this.aiClient = new AIClient(config.openaiApiKey);
  }
  
  /**
   * Ingest a story file and generate a complete game world
   */
  async ingestStory(storyContent: string): Promise<{
    world: World;
    characters: Character[];
  }> {
    console.log('Ingesting story file...');
    
    // Generate world data using AI
    const worldData = await this.aiClient.generateJSON<{
      world: Omit<World, 'id' | 'createdAt' | 'lastUpdated'>;
      characters: Omit<Character, 'id' | 'worldId' | 'createdAt' | 'lastUpdated'>[];
    }>(
      WORLD_BUILDER_SYSTEM_PROMPT,
      generateWorldBuilderPrompt(storyContent),
      null,
      0.7
    );
    
    console.log('World data generated:', {
      worldName: worldData.world.name,
      characterCount: worldData.characters.length,
    });
    
    // Create world in file storage
    const now = Date.now();
    const world: World = {
      ...worldData.world,
      id: `world-${Date.now()}`,
      createdAt: now,
      lastUpdated: now,
    };
    
    await fileStorage.saveWorld(world);
    
    // Create characters in file storage
    const characters: Character[] = [];
    for (const charData of worldData.characters) {
      const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const character: Character = {
        ...charData,
        id: characterId,
        createdAt: now,
        lastUpdated: now,
      };
      
      await fileStorage.saveCharacter(world.id, character);
      characters.push(character);
    }
    
    console.log(`Created world "${world.name}" with ${characters.length} characters`);
    
    return { world, characters };
  }
  
  /**
   * Get world by ID
   */
  async getWorld(worldId: string): Promise<World | null> {
    return await fileStorage.getWorld(worldId);
  }
  
  /**
   * Get all characters in a world
   */
  async getWorldCharacters(worldId: string): Promise<Character[]> {
    return await fileStorage.getWorldCharacters(worldId);
  }
  
  /**
   * List all worlds
   */
  async listWorlds(): Promise<World[]> {
    return await fileStorage.listWorlds();
  }
}
