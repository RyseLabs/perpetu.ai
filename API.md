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

### POST /api/worlds/upload

Upload a story file to generate a new game world with AI (multipart/form-data).

**Content-Type:** `multipart/form-data`

**Request:**
- `file` - Story file (plain text, markdown, or JSON)
- Max file size: 10MB

**Example:**
```bash
curl -F "file=@sample-story.md" http://localhost:3000/api/worlds/upload
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

**Error Responses:**
- `400` - No file uploaded or file is empty
- `500` - Failed to process story

---

### POST /api/worlds/ingest

Upload a story via JSON to generate a new game world with AI.

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
Same as `/api/worlds/upload`

---

### GET /api/worlds

List all worlds.

**Example:**
```bash
curl http://localhost:3000/api/worlds
```

**Success Response (200):**
```json
{
  "success": true,
  "worlds": [
    {
      "id": "world-1234567890",
      "name": "The Sacred Valley",
      ...
    },
    ...
  ]
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
      "stats": {...},
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

---

## Storage

All game data is stored in JSON files in the `./data` directory:

- **Worlds**: `./data/worlds/{worldId}.json`
- **Characters**: `./data/characters/{worldId}/{characterId}.json`
- **Events**: `./data/events/{worldId}/{eventId}.json`

Files are human-readable and can be manually edited if needed.

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

## Examples

### Complete Workflow

```bash
# 1. Upload a story file
curl -F "file=@sample-story.md" http://localhost:3000/api/worlds/upload

# Response includes world ID

# 2. Get world details
curl http://localhost:3000/api/worlds/world-1234567890

# 3. Get all characters
curl http://localhost:3000/api/worlds/world-1234567890/characters

# 4. Connect via WebSocket for real-time updates
# (use JavaScript/browser or ws client)
```

### File Upload from JavaScript

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/worlds/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('World created:', result.world);
```
