import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY!,
  
  // Game Settings
  turnDurationMs: parseInt(process.env.TURN_DURATION_MS || '30000', 10), // 30 seconds per turn in dev
  
  // Storage
  dataDir: process.env.DATA_DIR || './data',
};

// Validate required config
const requiredEnvVars = ['OPENAI_API_KEY'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(
      `Missing required environment variable: ${varName}. Please check your .env file.`
    );
  }
}
