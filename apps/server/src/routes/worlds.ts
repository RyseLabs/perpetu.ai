import { FastifyPluginAsync } from 'fastify';
import { WorldBuilderService } from '../services/world-builder.js';
import { fileStorage } from '../storage.js';

const worldBuilderService = new WorldBuilderService();

/**
 * World management routes
 */
export const worldRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/worlds/upload
   * Upload a story file to generate a new world (multipart/form-data)
   */
  fastify.post('/upload', async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'No file uploaded',
        });
      }
      
      const buffer = await data.toBuffer();
      const story = buffer.toString('utf-8');
      
      if (!story || story.trim().length === 0) {
        return reply.code(400).send({
          error: 'Story file is empty',
        });
      }
      
      const result = await worldBuilderService.ingestStory(story);
      
      return reply.code(201).send({
        success: true,
        world: result.world,
        characterCount: result.characters.length,
      });
    } catch (error) {
      console.error('World upload error:', error);
      return reply.code(500).send({
        error: 'Failed to upload story',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * POST /api/worlds/ingest
   * Upload a story via JSON to generate a new world
   */
  fastify.post<{
    Body: { story: string };
  }>('/ingest', async (request, reply) => {
    try {
      const { story } = request.body;
      
      if (!story || typeof story !== 'string') {
        return reply.code(400).send({
          error: 'Story content is required',
        });
      }
      
      const result = await worldBuilderService.ingestStory(story);
      
      return reply.code(201).send({
        success: true,
        world: result.world,
        characterCount: result.characters.length,
      });
    } catch (error) {
      console.error('World ingestion error:', error);
      return reply.code(500).send({
        error: 'Failed to ingest story',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * GET /api/worlds
   * List all worlds
   */
  fastify.get('/', async (_request, reply) => {
    try {
      const worlds = await worldBuilderService.listWorlds();
      
      return reply.send({
        success: true,
        worlds,
      });
    } catch (error) {
      console.error('List worlds error:', error);
      return reply.code(500).send({
        error: 'Failed to list worlds',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * GET /api/worlds/:worldId
   * Get world details
   */
  fastify.get<{
    Params: { worldId: string };
  }>('/:worldId', async (request, reply) => {
    try {
      const { worldId } = request.params;
      
      const world = await worldBuilderService.getWorld(worldId);
      
      if (!world) {
        return reply.code(404).send({
          error: 'World not found',
        });
      }
      
      return reply.send({
        success: true,
        world,
      });
    } catch (error) {
      console.error('Get world error:', error);
      return reply.code(500).send({
        error: 'Failed to fetch world',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * GET /api/worlds/:worldId/characters
   * Get all characters in a world
   */
  fastify.get<{
    Params: { worldId: string };
  }>('/:worldId/characters', async (request, reply) => {
    try {
      const { worldId } = request.params;
      
      const characters = await worldBuilderService.getWorldCharacters(worldId);
      
      return reply.send({
        success: true,
        characters,
      });
    } catch (error) {
      console.error('Get characters error:', error);
      return reply.code(500).send({
        error: 'Failed to fetch characters',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * POST /api/worlds/:worldId/locations
   * Add a new location to the world
   */
  fastify.post<{
    Params: { worldId: string };
    Body: {
      name: string;
      description: string;
      position: { x: number; y: number };
      type: 'city' | 'town' | 'dungeon' | 'landmark' | 'wilderness' | 'other';
      faction?: string;
    };
  }>('/:worldId/locations', async (request, reply) => {
    try {
      const { worldId } = request.params;
      const locationData = request.body;
      
      if (!locationData.name || !locationData.description || !locationData.position) {
        return reply.code(400).send({
          error: 'name, description, and position are required',
        });
      }
      
      const location = await worldBuilderService.addLocation(worldId, {
        ...locationData,
        discoveredByPlayer: true, // New locations are discovered
      });
      
      return reply.code(201).send({
        success: true,
        location,
      });
    } catch (error) {
      console.error('Add location error:', error);
      return reply.code(500).send({
        error: 'Failed to add location',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * GET /api/worlds/:worldId/chat
   * Get chat history for a world
   */
  fastify.get<{
    Params: { worldId: string };
  }>('/:worldId/chat', async (request, reply) => {
    try {
      const { worldId } = request.params;
      
      const messages = await fileStorage.getWorldChat(worldId);
      
      return reply.send({
        success: true,
        messages,
      });
    } catch (error) {
      console.error('Get chat history error:', error);
      return reply.code(500).send({
        error: 'Failed to fetch chat history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * DELETE /api/worlds/:worldId
   * Delete a world and all its data
   */
  fastify.delete<{
    Params: { worldId: string };
  }>('/:worldId', async (request, reply) => {
    try {
      const { worldId } = request.params;
      
      await fileStorage.deleteWorld(worldId);
      
      return reply.send({
        success: true,
        message: `World ${worldId} deleted successfully`,
      });
    } catch (error) {
      console.error('Delete world error:', error);
      return reply.code(500).send({
        error: 'Failed to delete world',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
