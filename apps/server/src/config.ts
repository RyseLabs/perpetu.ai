import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY!,
  
  // Game Settings
  turnDurationMs: parseInt(process.env.TURN_DURATION_MS || '30000', 10), // 30 seconds per turn in dev
};

// Validate required config
const requiredEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(
      `Missing required environment variable: ${varName}. Please check your .env file.`
    );
  }
}
