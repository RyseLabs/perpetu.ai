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
        console.log('Map image generated, downloading locally...');
        const filename = await fileStorage.downloadAndStoreImage(world.id, imageUrl);
        world.map.backgroundImageUrl = `/api/worlds/${world.id}/images/${filename}`;
        console.log('Map image saved locally:', filename);
      } catch (error) {
        console.error('Failed to generate map image:', error);
        // Continue without map image - we'll use a fallback
      }
    }
    
    await fileStorage.saveWorld(world);
    
    // Mark all initial locations as discovered so they show on the map
    if (world.map && world.map.locations) {
      world.map.locations = world.map.locations.map(loc => ({
        ...loc,
        discoveredByPlayer: true,
      }));
      await fileStorage.saveWorld(world);
    }
    
    // Create characters in file storage
    const characters: Character[] = [];
    for (const charData of worldData.characters) {
      const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate avatar for character
      let avatarUrl: string | undefined;
      try {
        console.log(`Generating avatar for ${charData.name}...`);
        const avatarPrompt = `Fantasy RPG character portrait: ${charData.name}. ${charData.description || 'A mysterious cultivator'}. Fantasy art style, detailed face portrait, ${charData.advancementTier} tier cultivator, heroic fantasy aesthetic, dramatic lighting.`;
        const generatedUrl = await this.aiClient.generateImage(avatarPrompt, '256x256');
        console.log(`Avatar generated for ${charData.name}, downloading locally...`);
        const filename = await fileStorage.downloadAndStoreImage(world.id, generatedUrl);
        avatarUrl = `/api/worlds/${world.id}/images/${filename}`;
        console.log(`Avatar saved locally for ${charData.name}:`, filename);
      } catch (error) {
        console.warn(`Failed to generate avatar for ${charData.name}:`, error);
        // Continue without avatar
      }
      
      const character: Character = {
        ...charData,
        id: characterId,
        avatarUrl,
        discoveredByPlayer: true, // Mark initial NPCs as discovered
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
