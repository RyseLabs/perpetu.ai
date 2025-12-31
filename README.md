# Perpetu.AI - AI Tabletop RPG Maker

A proof-of-concept visual AI tabletop RPG maker featuring AI-driven game loops, world simulation, and map visualization.

## 🚀 Quick Start

**New to the project?** Check out the [**Getting Started Guide**](./GETTING_STARTED.md) for complete setup instructions!

```bash
# Quick setup (requires PostgreSQL, Redis, and OpenAI API key)
pnpm install
cp .env.example .env  # Edit this with your credentials
pnpm -r build
cd apps/server && pnpm prisma:migrate && cd ../..
pnpm dev
```

Then open http://localhost:5173 to see the game interface!

## 📚 Documentation

- **[Getting Started Guide](./GETTING_STARTED.md)** - Detailed setup and installation
- **[Sample Story](./sample-story.md)** - Example world for testing
- **[API Documentation](#)** - Coming soon

## 🔐 Security Notice

**NEVER commit API keys or sensitive credentials to the repository!**

This project uses environment variables for all sensitive configuration. Before running the application:

1. Copy `.env.example` to `.env`
2. Fill in your actual API keys and credentials in `.env`
3. Ensure `.env` is listed in `.gitignore` (it is by default)

## 🏗️ Architecture

### Monorepo Structure
```
/apps
  /client   → React UI (map, HUD, chat)
  /server   → API, simulation engine
/packages
  /ai       → Prompt templates + validators
  /engine   → Turn system, combat, travel
  /models   → Shared schemas (Zod)
```

## 🚀 Tech Stack

### Frontend
- React + TypeScript
- Vite
- Zustand (state management)
- React Flow (map rendering)
- TailwindCSS
- WebSockets (live updates)

### Backend
- Node.js + TypeScript
- Fastify
- PostgreSQL (world persistence)
- Prisma ORM
- Redis (turn simulation + scheduling)
- OpenAI API (AI-driven gameplay)

## 📋 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL
- Redis
- OpenAI API key

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials:
# - OPENAI_API_KEY: Your OpenAI API key
# - DATABASE_URL: PostgreSQL connection string
# - REDIS_URL: Redis connection string
```

### 3. Database Setup

```bash
# Run database migrations
cd apps/server
pnpm prisma migrate dev
```

### 4. Start Development Servers

```bash
# Start all services in development mode
pnpm dev

# Or start individually:
cd apps/client && pnpm dev  # Frontend on http://localhost:5173
cd apps/server && pnpm dev  # Backend on http://localhost:3000
```

## 🎮 Game Systems

### Advancement System
Characters progress through tiers (Foundation → Monarch), with each tier providing combat bonuses, increased perception range, and faster travel speed.

### Madra System
Core magic system where characters have madra cores with specific natures (Pure, Fire, Water, etc.), allowing them to use techniques and advance by cycling scales from defeated enemies.

### Combat System
Turn-based combat using D&D 5e mechanics enhanced with advancement tier bonuses and madra techniques.

### AI-Driven Game Loop
- Turn-based simulation with time advancement
- AI updates NPC states and positions
- Dynamic event generation
- Autonomous NPC behavior

## 📖 Development

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Run TypeScript type checking
- `pnpm test` - Run all tests

## 🔒 Security Best Practices

1. ✅ Use environment variables for sensitive data
2. ✅ Never commit `.env` files
3. ✅ Rotate API keys if exposed
4. ✅ Use `.env.example` for documentation only
5. ✅ Review code for hardcoded credentials before committing

## 📝 License

Private - All rights reserved
