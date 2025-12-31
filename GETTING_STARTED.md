# Getting Started with Perpetu.AI

This guide will help you set up and run the Perpetu.AI tabletop RPG maker from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **PostgreSQL** ([Download](https://www.postgresql.org/download/))
- **Redis** ([Download](https://redis.io/download/))
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository (or navigate to the project directory)
cd perpetu.ai

# Install all dependencies
pnpm install
```

## Step 2: Set Up PostgreSQL Database

### Option A: Local PostgreSQL Installation

1. Start PostgreSQL service
2. Create a new database:

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE perpetu_ai;

# Exit psql
\q
```

3. Your connection string will be:
```
postgresql://username:password@localhost:5432/perpetu_ai
```

### Option B: Docker PostgreSQL

```bash
docker run --name perpetu-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=perpetu_ai \
  -p 5432:5432 \
  -d postgres:15
```

Connection string: `postgresql://postgres:your_password@localhost:5432/perpetu_ai`

## Step 3: Set Up Redis

### Option A: Local Redis Installation

```bash
# Start Redis server
redis-server
```

### Option B: Docker Redis

```bash
docker run --name perpetu-redis \
  -p 6379:6379 \
  -d redis:7
```

## Step 4: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/perpetu_ai

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Settings
CORS_ORIGIN=http://localhost:5173
```

⚠️ **IMPORTANT**: Replace `sk-your-actual-openai-api-key-here` with your real OpenAI API key!

## Step 5: Build All Packages

```bash
# Build all shared packages
pnpm -r build
```

This will compile TypeScript for all packages and apps.

## Step 6: Set Up Database Schema

```bash
# Navigate to server directory
cd apps/server

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Return to root directory
cd ../..
```

## Step 7: Start the Development Servers

You can either start all services at once or individually:

### Option A: Start All Services (Recommended)

```bash
# From the root directory
pnpm dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend on http://localhost:5173

### Option B: Start Services Individually

In separate terminal windows:

```bash
# Terminal 1: Start backend
cd apps/server
pnpm dev

# Terminal 2: Start frontend
cd apps/client
pnpm dev
```

## Step 8: Verify Everything is Running

1. **Check Backend Health**:
   - Open http://localhost:3000/health
   - Should see: `{"status":"ok","timestamp":"..."}`

2. **Check Frontend**:
   - Open http://localhost:5173
   - Should see the Perpetu.AI game interface

3. **Check Database Connection**:
   ```bash
   cd apps/server
   pnpm prisma:studio
   ```
   This opens a database browser at http://localhost:5555

## Step 9: Test the World Builder

### Using the API

You can test world building with the included sample story:

```bash
# Read the sample story
cat sample-story.md

# Test the API (you'll need to send this as a POST request)
curl -X POST http://localhost:3000/api/worlds/ingest \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "story": "... paste the sample-story.md content here ..."
}
EOF
```

### Using the Frontend (Coming Soon)

In the future, the frontend will have a file upload interface for story ingestion.

## Troubleshooting

### "Cannot find module '@prisma/client'"

Run:
```bash
cd apps/server
pnpm prisma:generate
```

### "connect ECONNREFUSED" (Database)

- Ensure PostgreSQL is running
- Verify your DATABASE_URL in `.env` is correct
- Test connection: `psql postgresql://...your-connection-string...`

### "Redis connection failed"

- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Verify REDIS_URL in `.env` is correct

### "OpenAI API error: 401"

- Check your OPENAI_API_KEY in `.env` is valid
- Verify you have credits in your OpenAI account

### Port already in use

If port 3000 or 5173 is already in use:
- Change PORT in `.env` for the backend
- Change port in `apps/client/vite.config.ts` for frontend

## Project Structure

```
perpetu.ai/
├── apps/
│   ├── client/          # React frontend
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── store/       # Zustand state
│   │   │   └── App.tsx      # Main app
│   │   └── package.json
│   └── server/          # Fastify backend
│       ├── prisma/          # Database schema
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── services/    # Business logic
│       │   └── index.ts     # Server entry
│       └── package.json
├── packages/
│   ├── models/          # Zod schemas (shared types)
│   ├── ai/              # OpenAI integration
│   └── engine/          # Game logic (dice, combat, travel)
├── .env                 # Your environment variables (DO NOT COMMIT)
├── .env.example         # Template for environment variables
├── sample-story.md      # Example world story
└── README.md           # Project overview
```

## Next Steps

1. **Read the sample story**: `sample-story.md` shows the expected format
2. **Explore the API**: Check `apps/server/src/routes/` for available endpoints
3. **Customize the UI**: Modify components in `apps/client/src/components/`
4. **Add game systems**: Extend the engine in `packages/engine/`
5. **Create your own world**: Write a story and ingest it!

## Development Tips

- **Hot Reload**: Both frontend and backend support hot reload during development
- **Type Safety**: All code is TypeScript with strict types
- **Debugging**: Use VSCode's debugger with the included launch configs (coming soon)
- **Database GUI**: Use `pnpm prisma:studio` to browse your database
- **Redis CLI**: Use `redis-cli` to inspect Redis data

## Additional Resources

- [Fastify Documentation](https://www.fastify.io/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Flow Documentation](https://reactflow.dev/)

## Need Help?

If you encounter issues not covered here, check:
1. All services are running (PostgreSQL, Redis, backend, frontend)
2. Environment variables are set correctly in `.env`
3. Dependencies are installed: `pnpm install`
4. Packages are built: `pnpm -r build`
5. Database is migrated: `cd apps/server && pnpm prisma:migrate`

Happy Gaming! 🎮
