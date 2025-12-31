import { AIClient, generateWorldBuilderPrompt, WORLD_BUILDER_SYSTEM_PROMPT } from '@perpetu-ai/ai';
import { World, Character, WorldMap } from '@perpetu-ai/models';
import { prisma } from '../db.js';
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
    
    // Create world in database
    const now = Date.now();
    const world: World = {
      ...worldData.world,
      id: `world-${Date.now()}`,
      createdAt: now,
      lastUpdated: now,
    };
    
    await prisma.world.create({
      data: {
        id: world.id,
        name: world.name,
        description: world.description,
        mapData: world.map as any,
        currentTurn: world.currentTurn,
        factions: world.factions,
        createdAt: new Date(world.createdAt),
        lastUpdated: new Date(world.lastUpdated),
      },
    });
    
    // Create characters in database
    const characters: Character[] = [];
    for (const charData of worldData.characters) {
      const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const character: Character = {
        ...charData,
        id: characterId,
        createdAt: now,
        lastUpdated: now,
      };
      
      await prisma.character.create({
        data: {
          id: character.id,
          worldId: world.id,
          name: character.name,
          description: character.description || '',
          advancementTier: character.advancementTier,
          madraCore: character.madraCore as any,
          techniques: character.techniques as any,
          stats: character.stats as any,
          inventory: character.inventory as any,
          position: character.position as any,
          activity: character.activity,
          currentGoal: character.currentGoal,
          timeline: character.timeline as any,
          faction: character.faction,
          isPlayerCharacter: character.isPlayerCharacter,
          isInPlayerParty: character.isInPlayerParty,
          discoveredByPlayer: character.discoveredByPlayer,
          teacherId: character.teacherId,
          createdAt: new Date(character.createdAt),
          lastUpdated: new Date(character.lastUpdated),
        },
      });
      
      characters.push(character);
    }
    
    console.log(`Created world "${world.name}" with ${characters.length} characters`);
    
    return { world, characters };
  }
  
  /**
   * Get world by ID
   */
  async getWorld(worldId: string): Promise<World | null> {
    const worldRecord = await prisma.world.findUnique({
      where: { id: worldId },
    });
    
    if (!worldRecord) return null;
    
    return {
      id: worldRecord.id,
      name: worldRecord.name,
      description: worldRecord.description,
      map: worldRecord.mapData as WorldMap,
      currentTurn: worldRecord.currentTurn,
      characterIds: [], // Loaded separately
      factions: worldRecord.factions,
      createdAt: worldRecord.createdAt.getTime(),
      lastUpdated: worldRecord.lastUpdated.getTime(),
    };
  }
  
  /**
   * Get all characters in a world
   */
  async getWorldCharacters(worldId: string): Promise<Character[]> {
    const characters = await prisma.character.findMany({
      where: { worldId },
    });
    
    return characters.map((char: any): Character => ({
      id: char.id,
      name: char.name,
      description: char.description || undefined,
      advancementTier: char.advancementTier as any,
      madraCore: char.madraCore as any,
      techniques: char.techniques as any,
      stats: char.stats as any,
      inventory: char.inventory as any,
      position: char.position as any,
      activity: char.activity as any,
      currentGoal: char.currentGoal || undefined,
      timeline: char.timeline as any,
      faction: char.faction || undefined,
      isPlayerCharacter: char.isPlayerCharacter,
      isInPlayerParty: char.isInPlayerParty,
      discoveredByPlayer: char.discoveredByPlayer,
      teacherId: char.teacherId || undefined,
      createdAt: char.createdAt.getTime(),
      lastUpdated: char.lastUpdated.getTime(),
    }));
  }
}
