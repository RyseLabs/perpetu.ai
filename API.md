# API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: TBD

## Authentication
Currently, no authentication is required. This should be added for production use.

---

## Health Check

### GET /health

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## World Management

### POST /api/worlds/ingest

Upload a story file to generate a new game world with AI.

**Request Body:**
```json
{
  "story": "string - The complete story/world description"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/worlds/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "story": "The Sacred Valley is a mystical land..."
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "world": {
    "id": "world-1234567890",
    "name": "The Sacred Valley",
    "description": "A mystical land...",
    "map": {
      "id": "map-123",
      "name": "Sacred Valley Map",
      "width": 1000,
      "height": 500,
      "locations": [...]
    },
    "currentTurn": 0,
    "characterIds": [],
    "factions": ["Heaven's Glory School", "Wei Clan", ...],
    "createdAt": 1234567890000,
    "lastUpdated": 1234567890000
  },
  "characterCount": 7
}
```

**Error Response (400):**
```json
{
  "error": "Story content is required"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to ingest story",
  "message": "Detailed error message"
}
```

---

### GET /api/worlds/:worldId

Retrieve details about a specific world.

**Parameters:**
- `worldId` (path) - The unique identifier of the world

**Example:**
```bash
curl http://localhost:3000/api/worlds/world-1234567890
```

**Success Response (200):**
```json
{
  "success": true,
  "world": {
    "id": "world-1234567890",
    "name": "The Sacred Valley",
    "description": "A mystical land...",
    "map": {...},
    "currentTurn": 0,
    "characterIds": [],
    "factions": [...],
    "createdAt": 1234567890000,
    "lastUpdated": 1234567890000
  }
}
```

**Error Response (404):**
```json
{
  "error": "World not found"
}
```

---

### GET /api/worlds/:worldId/characters

Retrieve all characters in a specific world.

**Parameters:**
- `worldId` (path) - The unique identifier of the world

**Example:**
```bash
curl http://localhost:3000/api/worlds/world-1234567890/characters
```

**Success Response (200):**
```json
{
  "success": true,
  "characters": [
    {
      "id": "char-123",
      "name": "Lindon",
      "description": "A young cultivator...",
      "advancementTier": "Foundation",
      "madraCore": {
        "nature": "Pure",
        "currentMadra": 100,
        "maxMadra": 100,
        "tier": "Foundation"
      },
      "techniques": [],
      "stats": {
        "strength": 10,
        "dexterity": 12,
        "constitution": 10,
        "intelligence": 14,
        "wisdom": 12,
        "charisma": 10,
        "maxHp": 20,
        "currentHp": 20,
        "armorClass": 12,
        "initiative": 0,
        "tierBonus": 0
      },
      "inventory": [],
      "position": { "x": 250, "y": 300 },
      "activity": "idle",
      "currentGoal": "Reach Iron rank",
      "timeline": [...],
      "faction": "Wei Clan",
      "isPlayerCharacter": true,
      "isInPlayerParty": true,
      "discoveredByPlayer": true,
      "teacherId": null,
      "createdAt": 1234567890000,
      "lastUpdated": 1234567890000
    },
    ...
  ]
}
```

---

## WebSocket API

### WS /ws/worlds/:worldId

Connect to a world for real-time updates.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/worlds/world-1234567890');

ws.onopen = () => {
  console.log('Connected to world');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

**Message Types:**

#### Connected
Sent when connection is established.
```json
{
  "type": "connected",
  "payload": {
    "worldId": "world-1234567890",
    "message": "Connected to world updates"
  }
}
```

#### Ping/Pong
Client can send ping to check connection.
```json
// Client sends:
{
  "type": "ping",
  "payload": {}
}

// Server responds:
{
  "type": "pong",
  "payload": {}
}
```

#### Subscribe to Character
Subscribe to updates for a specific character.
```json
// Client sends:
{
  "type": "subscribe_character",
  "payload": {
    "characterId": "char-123"
  }
}
```

#### Character Update (Server -> Client)
Sent when a subscribed character is updated.
```json
{
  "type": "character_update",
  "payload": {
    "character": {...},
    "changes": ["position", "stats"]
  }
}
```

#### Turn Update (Server -> Client)
Sent when the turn advances.
```json
{
  "type": "turn_update",
  "payload": {
    "turn": 5,
    "events": [...],
    "updatedCharacters": [...]
  }
}
```

---

## Game Systems

### Advancement Tiers

Characters progress through tiers, each providing combat bonuses:

| Tier | Level | Combat Bonus | Perception Range | Travel Speed |
|------|-------|--------------|------------------|--------------|
| Foundation | 0 | ±0 | 1/256 map | 1/256 map/day |
| Iron | 1 | ±3 | 1/128 map | 1/128 map/day |
| Jade | 2 | ±6 | 1/64 map | 1/64 map/day |
| Low Gold | 3 | ±9 | 1/32 map | 1/32 map/day |
| High Gold | 4 | ±12 | 1/32 map | 1/32 map/day |
| True Gold | 5 | ±15 | 1/16 map | 1/16 map/day |
| Underlord | 6 | ±18 | 1/8 map | 1/8 map/day |
| Overlord | 7 | ±21 | 1/4 map | 1/4 map/day |
| Archlord | 8 | ±24 | 1/2 map | 1/2 map/day |
| Herald/Sage | 9 | ±27 | 1/2 map | 1/2 map/day |
| Monarch | 10 | ±30 | Full map | Instant |

**Tier Bonus Calculation:**
- Each tier difference = ±3 to rolls
- Example: Iron (1) vs Underlord (6) = 5 tier difference
- Iron gets -15, Underlord gets +15

### Madra Natures

20 different madra natures, each with unique effects:

- **Pure** - Disrupts enemy techniques
- **Fire** - High damage, explosive
- **Water** - Control and endurance
- **Earth** - Defense and durability
- **Wind** - Speed and cutting
- **Sword** - Precision strikes
- **Force** - Kinetic impact
- **Destruction** - Annihilates matter
- **Life** - Healing and growth
- **Death** - Decay and entropy
- And 10 more...

### Combat System

Turn-based combat using D&D 5e mechanics enhanced with:
- Advancement tier bonuses (±3 per tier)
- Madra technique system
- Deterministic dice rolls
- Technique proficiency progression

### Advancement Resources (Scales)

- Enemies drop scales containing 1/20-1/30 of their remaining madra
- Cycling scales fills core and increases capacity
- Advancement occurs when capacity threshold is met
- Exponential growth per tier

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting. Should be added for production.

---

## Coming Soon

- Turn simulation endpoints
- Combat resolution endpoints
- Character action endpoints
- Event query endpoints
- Authentication & authorization
- Rate limiting
- Webhook support for turn updates
