# Getting Started with Perpetu.AI

This guide will help you set up and run the Perpetu.AI tabletop RPG maker from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **pnpm** (optional: `npm install -g pnpm`)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

**That's it!** No Docker, PostgreSQL, or Redis required! 🎉

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository (or navigate to the project directory)
cd perpetu.ai

# Install all dependencies (choose one)
npm install
# or
pnpm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and add your OpenAI API key:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Server Configuration (optional, these are the defaults)
PORT=3000
NODE_ENV=development

# CORS Settings (optional)
CORS_ORIGIN=http://localhost:5173

# Storage Configuration (optional, defaults to ./data)
# DATA_DIR=./data
```

⚠️ **IMPORTANT**: Replace `sk-your-actual-openai-api-key-here` with your real OpenAI API key!

## Step 3: Build All Packages

```bash
# Build all shared packages (choose one)
npm run build
# or
pnpm build
```

This will compile TypeScript for all packages and apps.

## Step 4: Start the Development Servers

```bash
# Start both frontend and backend (choose one)
npm run dev
# or
pnpm dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend on http://localhost:5173

## Step 5: Verify Everything is Running

1. **Check Backend Health**:
   - Open http://localhost:3000/health
   - Should see: `{"status":"ok","timestamp":"..."}`

2. **Check Frontend**:
   - Open http://localhost:5173
   - Should see the Perpetu.AI game interface

3. **Check Data Storage**:
   - A `./data` directory will be automatically created
   - Game worlds, characters, and events are stored as JSON files

## Step 6: Upload a Story File

You can test world building with the included sample story:

### Using curl:
```bash
curl -F "file=@sample-story.md" http://localhost:3000/api/worlds/upload
```

### Using the API directly:
```bash
curl -X POST http://localhost:3000/api/worlds/ingest \
  -H "Content-Type: application/json" \
  -d '{"story": "Your story content here..."}'
```

### Response:
```json
{
  "success": true,
  "world": {
    "id": "world-1234567890",
    "name": "The Sacred Valley",
    ...
  },
  "characterCount": 7
}
```

The world will be saved in `./data/worlds/world-1234567890.json` and characters in `./data/characters/world-1234567890/*.json`.

## Project Structure

```
perpetu.ai/
├── apps/
│   ├── client/          # React frontend (3-panel HUD)
│   └── server/          # Fastify backend (API + WebSockets)
│       └── src/
│           └── storage.ts  # File-based storage
├── packages/
│   ├── models/          # Zod schemas (shared types)
│   ├── ai/              # OpenAI integration
│   └── engine/          # Game logic (dice, combat, travel, turns)
├── data/                # Game state (auto-created, gitignored)
│   ├── worlds/          # World files
│   ├── characters/      # Character files by world
│   └── events/          # Event files by world
├── GETTING_STARTED.md   # This guide
├── API.md               # API documentation
├── sample-story.md      # Example world
└── README.md            # Project overview
```

## Troubleshooting

### "Cannot find module '@perpetu-ai/...'"

Run:
```bash
npm run build
# or
pnpm build
```

### "Missing required environment variable: OPENAI_API_KEY"

- Ensure you created `.env` from `.env.example`
- Verify your OPENAI_API_KEY in `.env` is correct
- Make sure the `.env` file is in the root directory

### "OpenAI API error: 401"

- Check your OPENAI_API_KEY in `.env` is valid
- Verify you have credits in your OpenAI account
- Generate a new API key if the old one was exposed

### Port already in use

If port 3000 or 5173 is already in use:
- Change PORT in `.env` for the backend
- Change port in `apps/client/vite.config.ts` for frontend

### Permission errors with ./data directory

The server will automatically create the `./data` directory. If you get permission errors:
```bash
mkdir -p ./data
chmod 755 ./data
```

## Development Tips

- **Hot Reload**: Both frontend and backend support hot reload during development
- **Type Safety**: All code is TypeScript with strict types
- **File Storage**: Game state is human-readable JSON in `./data`
- **No Database Setup**: Everything just works out of the box!

## Next Steps

1. **Upload a story**: Use the sample-story.md or create your own
2. **Explore the API**: Check API.md for available endpoints
3. **Customize the UI**: Modify components in `apps/client/src/components/`
4. **Add game systems**: Extend the engine in `packages/engine/`

Happy Gaming! 🎮
