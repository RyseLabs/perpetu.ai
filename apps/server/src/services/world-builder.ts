import { AIClient, generateWorldBuilderPrompt, WORLD_BUILDER_SYSTEM_PROMPT, generateMapImagePrompt } from '@perpetu-ai/ai';
import { World, Character, Location } from '@perpetu-ai/models';
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
      hasMap: !!worldData.world.map,
    });
    
    // Create world in file storage
    const now = Date.now();
    
    // Ensure map structure exists with defaults
    if (!worldData.world.map) {
      console.warn('World data missing map, creating default');
      worldData.world.map = {
        id: `map-${now}`,
        name: worldData.world.name,
        description: worldData.world.description,
        width: 100,
        height: 100,
        locations: [],
        createdAt: now,
      };
    }
    
    // Ensure map has required fields
    if (!worldData.world.map.id) {
      worldData.world.map.id = `map-${now}`;
    }
    if (!worldData.world.map.createdAt) {
      worldData.world.map.createdAt = now;
    }
    if (!worldData.world.map.locations) {
      worldData.world.map.locations = [];
    }
    
    const world: World = {
      ...worldData.world,
      id: `world-${Date.now()}`,
      createdAt: now,
      lastUpdated: now,
    };
    
    // Generate map image if no background image is set
    if (!world.map.backgroundImageUrl) {
      try {
        console.log('Generating map image...');
        const imageUrl = await this.aiClient.generateImage(
          generateMapImagePrompt(world),
          '1792x1024'
        );
        world.map.backgroundImageUrl = imageUrl;
        console.log('Map image generated:', imageUrl);
      } catch (error) {
        console.error('Failed to generate map image:', error);
        // Continue without map image - we'll use a fallback
      }
    }
    
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
   * Add a new location to the world (discovered via gameplay)
   */
  async addLocation(worldId: string, location: Omit<Location, 'id'>): Promise<Location> {
    const world = await fileStorage.getWorld(worldId);
    if (!world) {
      throw new Error('World not found');
    }
    
    const newLocation: Location = {
      ...location,
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    world.map.locations.push(newLocation);
    world.lastUpdated = Date.now();
    
    await fileStorage.saveWorld(world);
    
    console.log(`Added location "${newLocation.name}" to world "${world.name}"`);
    
    return newLocation;
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
