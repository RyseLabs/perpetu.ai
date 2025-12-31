import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { worldRoutes } from './routes/worlds.js';
import { websocketRoutes } from './routes/websocket.js';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'debug' : 'info',
  },
});

/**
 * Register plugins
 */
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });
  
  // WebSocket support
  await fastify.register(websocket);
}

/**
 * Register routes
 */
async function registerRoutes() {
  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
  
  // API routes
  fastify.register(worldRoutes, { prefix: '/api/worlds' });
  
  // WebSocket routes
  fastify.register(websocketRoutes, { prefix: '/ws' });
}

/**
 * Start server
 */
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    await fastify.listen({
      port: config.port,
      host: config.host,
    });
    
    console.log(`
┌─────────────────────────────────────────────┐
│  Perpetu.AI Server                          │
├─────────────────────────────────────────────┤
│  Server:     http://${config.host}:${config.port}       │
│  Health:     http://${config.host}:${config.port}/health │
│  Environment: ${config.nodeEnv.padEnd(28)} │
└─────────────────────────────────────────────┘
    `);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

// Start the server
start();
