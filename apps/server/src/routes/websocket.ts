import { FastifyPluginAsync } from 'fastify';
import { SocketStream } from '@fastify/websocket';

interface WebSocketMessage {
  type: string;
  payload: any;
}

/**
 * WebSocket routes for real-time game updates
 */
export const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * WebSocket connection for world updates
   */
  fastify.get('/worlds/:worldId', { websocket: true }, (connection: SocketStream, request) => {
    const { worldId } = request.params as { worldId: string };
    
    console.log(`WebSocket connected for world: ${worldId}`);
    
    // Send welcome message
    connection.socket.send(JSON.stringify({
      type: 'connected',
      payload: { worldId, message: 'Connected to world updates' },
    }));
    
    // Handle incoming messages
    connection.socket.on('message', (rawMessage: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(rawMessage.toString());
        
        console.log('Received message:', message);
        
        // Handle different message types
        switch (message.type) {
          case 'ping':
            connection.socket.send(JSON.stringify({
              type: 'pong',
              payload: {},
            }));
            break;
            
          case 'subscribe_character':
            // Subscribe to specific character updates
            console.log('Subscribing to character:', message.payload.characterId);
            break;
            
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle disconnection
    connection.socket.on('close', () => {
      console.log(`WebSocket disconnected for world: ${worldId}`);
    });
    
    // Handle errors
    connection.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });
};

/**
 * Broadcast update to all connected clients for a world
 */
export function broadcastWorldUpdate(worldId: string, update: any) {
  // This will be implemented with a proper pub/sub system using Redis
  console.log('Broadcasting update for world:', worldId, update);
}
