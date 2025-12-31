import { FastifyPluginAsync } from 'fastify';
import { GameMasterService } from '../services/game-master.js';

const gameMasterService = new GameMasterService();

/**
 * Game Master routes for gameplay interaction
 */
export const gameMasterRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/gm/player-character
   * Create a player character from description
   */
  fastify.post<{
    Body: { worldId: string; description: string };
  }>('/player-character', async (request, reply) => {
    try {
      const { worldId, description } = request.body;
      
      if (!worldId || !description) {
        return reply.code(400).send({
          error: 'worldId and description are required',
        });
      }
      
      // Check if player character already exists
      const hasPlayer = await gameMasterService.hasPlayerCharacter(worldId);
      if (hasPlayer) {
        return reply.code(400).send({
          error: 'Player character already exists for this world',
        });
      }
      
      const character = await gameMasterService.createPlayerCharacter(worldId, description);
      
      return reply.code(201).send({
        success: true,
        character,
      });
    } catch (error) {
      console.error('Player character creation error:', error);
      return reply.code(500).send({
        error: 'Failed to create player character',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * POST /api/gm/chat
   * Handle game master chat interaction
   */
  fastify.post<{
    Body: { 
      worldId: string; 
      message: string;
      chatHistory: Array<{ sender: string; content: string }>;
    };
  }>('/chat', async (request, reply) => {
    try {
      const { worldId, message, chatHistory = [] } = request.body;
      
      if (!worldId || !message) {
        return reply.code(400).send({
          error: 'worldId and message are required',
        });
      }
      
      const response = await gameMasterService.handlePlayerMessage(
        worldId,
        message,
        chatHistory
      );
      
      return reply.send({
        success: true,
        response,
      });
    } catch (error) {
      console.error('Game master chat error:', error);
      return reply.code(500).send({
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  /**
   * GET /api/gm/player-character/:worldId
   * Get player character for a world
   */
  fastify.get<{
    Params: { worldId: string };
  }>('/player-character/:worldId', async (request, reply) => {
    try {
      const { worldId } = request.params;
      
      const character = await gameMasterService.getPlayerCharacter(worldId);
      
      if (!character) {
        return reply.code(404).send({
          error: 'Player character not found',
        });
      }
      
      return reply.send({
        success: true,
        character,
      });
    } catch (error) {
      console.error('Get player character error:', error);
      return reply.code(500).send({
        error: 'Failed to get player character',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
