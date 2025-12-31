import { FastifyPluginAsync } from 'fastify';
import { WorldBuilderService } from '../services/world-builder.js';

const worldBuilderService = new WorldBuilderService();

/**
 * World management routes
 */
export const worldRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/worlds/ingest
   * Upload a story file to generate a new world
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
};
