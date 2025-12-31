import type { Character, World } from '@perpetu-ai/models';

/**
 * System prompt for the World Builder AI that ingests story files
 */
export const WORLD_BUILDER_SYSTEM_PROMPT = `You are a World Builder AI for a tabletop RPG game. Your task is to parse world data and generate structured game objects.

You must output valid JSON that matches the expected schemas.

Key responsibilities:
1. Parse world/story descriptions
2. Generate a world map with dimensions and locations
3. Create characters (NPCs) with:
   - Starting positions on the map
   - Advancement tiers (Foundation to Monarch)
   - Madra cores with natures
   - Initial stats based on their tier
   - Timeline events for autonomous behavior
   - Factions and relationships

Important rules:
- Be creative but consistent with the source material
- Ensure characters have realistic starting positions
- Distribute advancement tiers realistically (most should be lower tiers)
- Give each character meaningful goals and timeline events
- Assign appropriate madra natures based on character background

Output format: JSON matching the World schema with embedded characters and locations.`;

/**
 * Generate prompt for world building from story file
 */
export function generateWorldBuilderPrompt(storyContent: string): string {
  return `Parse the following story/world data and generate a complete game world:

${storyContent}

Generate a JSON response with this EXACT structure:

{
  "world": {
    "name": "World Name",
    "description": "World description",
    "map": {
      "name": "World Name",
      "description": "Map description",
      "width": 100,
      "height": 100,
      "locations": [
        {
          "name": "Location Name",
          "description": "Location description",
          "position": { "x": 10.5, "y": 20.3 },
          "type": "city" | "town" | "dungeon" | "landmark" | "wilderness" | "other",
          "discoveredByPlayer": false,
          "faction": "optional faction name"
        }
      ]
    },
    "currentTurn": 0,
    "characterIds": [],
    "factions": ["faction1", "faction2"]
  },
  "characters": [
    {
      "name": "Character Name",
      "description": "Character background",
      "advancementTier": "Foundation" | "Iron" | "Jade" | "LowGold" | "HighGold" | "TrueGold" | "Underlord" | "Overlord" | "Archlord" | "Herald" | "Sage" | "Monarch",
      "madraCore": {
        "nature": "Pure" | "Fire" | "Water" | "Earth" | etc.,
        "currentMadra": 100,
        "maxMadra": 100
      },
      "stats": {
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 10,
        "charisma": 10,
        "maxHp": 30,
        "currentHp": 30,
        "armorClass": 12,
        "initiative": 0,
        "tierBonus": 0
      },
      "position": { "x": 15.0, "y": 25.0 },
      "activity": "idle",
      "currentGoal": "Character's immediate goal",
      "timeline": [
        {
          "id": "event-1",
          "turn": 10,
          "description": "Event description",
          "action": "move" | "combat" | "interact" | "train" | "custom",
          "completed": false,
          "priority": 5
        }
      ],
      "faction": "faction name",
      "isPlayerCharacter": false,
      "isInPlayerParty": false,
      "discoveredByPlayer": false,
      "techniques": [],
      "inventory": []
    }
  ]
}

Important:
- Generate 5-15 key characters with realistic tier distribution (most at Foundation/Iron/Jade)
- Place characters at appropriate starting locations
- Give each character 2-4 timeline events
- Ensure positions fit within map dimensions
- Make locations diverse (cities, dungeons, landmarks, etc.)
- Set discoveredByPlayer to false for all locations initially`;
}

/**
 * System prompt for the Game Master AI
 */
export const GAME_MASTER_SYSTEM_PROMPT = `You are the Game Master AI for a turn-based tabletop RPG. You narrate events, manage NPCs, and govern the game world.

Core responsibilities:
1. Narrate events as they unfold
2. Update NPC states each turn
3. Generate dynamic encounters when appropriate
4. Reveal information based on player proximity and perception
5. Manage combat encounters
6. Track character progression and stat updates
7. Update character positions as they traverse the map
8. Track equipment and inventory changes during gameplay

Important rules:
- Only reveal information the player can perceive based on their advancement tier
- Higher-tier NPCs can perceive and react to distant events
- Combat uses D&D 5e mechanics + advancement tier bonuses
- Characters gain strength by defeating enemies and cycling scales
- Time advances each turn, triggering timeline events
- NPCs move autonomously toward their goals
- When characters move, update their position { x, y } coordinates
- Track equipment changes (equipping, unequipping, finding, breaking)
- Update inventory when characters loot, buy, use, or drop items
- Equipment affects character stats (weapons increase damage, armor increases AC)

Advancement system:
- Each tier difference = ±3 bonus in combat
- Perception range scales with advancement (Monarch sees entire map)
- Travel speed scales with advancement (Monarch travels instantly)

Always output deterministic, schema-validated JSON for game state updates.
Frequently update character positions and equipment in your responses.`;

/**
 * Generate prompt for turn simulation
 */
export function generateTurnSimulationPrompt(
  world: World,
  characters: Character[],
  currentTurn: number
): string {
  return `Update the game world for turn ${currentTurn}.

Current world state:
${JSON.stringify({ world, characters }, null, 2)}

For this turn:
1. Check each character's timeline for events at turn ${currentTurn}
2. Move characters toward their current goals based on travel speed
3. Check for proximity encounters (characters near each other)
4. Update character activities (traveling, training, resting, etc.)
5. Generate events for high-tier NPCs reacting to distant happenings

Output JSON with:
- Updated character positions and activities
- Triggered timeline events
- Generated world events
- Any combat encounters that should begin
- Narrative description of what happened this turn

Remember: Higher-tier characters can see and react to more of the map.`;
}

/**
 * Generate prompt for combat resolution
 */
export function generateCombatPrompt(
  attacker: Character,
  defender: Character,
  action: string
): string {
  const tierBonus = calculateTierBonusDescription(attacker, defender);
  
  return `Resolve combat action between:

Attacker: ${attacker.name} (${attacker.advancementTier})
- Current HP: ${attacker.stats.currentHp}/${attacker.stats.maxHp}
- Current Madra: ${attacker.madraCore.currentMadra}/${attacker.madraCore.maxMadra}
- Madra Nature: ${attacker.madraCore.nature}

Defender: ${defender.name} (${defender.advancementTier})
- Current HP: ${defender.stats.currentHp}/${defender.stats.maxHp}
- Armor Class: ${defender.stats.armorClass}

Action: ${action}

${tierBonus}

Use D&D 5e mechanics:
1. Roll d20 + modifiers + tier bonus
2. Compare to defender's AC
3. On hit, roll damage
4. Apply madra costs if technique used
5. Apply madra nature effects

Output JSON with:
- Dice rolls (deterministic)
- Hit/miss result
- Damage dealt
- Madra consumed
- Status effects
- Narrative description`;
}

/**
 * Helper to describe tier bonus
 */
function calculateTierBonusDescription(char1: Character, char2: Character): string {
  const tierLevels: Record<string, number> = {
    Foundation: 0, Iron: 1, Jade: 2, LowGold: 3, HighGold: 4,
    TrueGold: 5, Underlord: 6, Overlord: 7, Archlord: 8,
    Herald: 9, Sage: 9, Monarch: 10,
  };
  
  const level1 = tierLevels[char1.advancementTier];
  const level2 = tierLevels[char2.advancementTier];
  const difference = level1 - level2;
  const bonus = difference * 3;
  
  if (bonus > 0) {
    return `Tier Bonus: ${char1.name} has +${bonus} bonus (${Math.abs(difference)} tiers higher)`;
  } else if (bonus < 0) {
    return `Tier Penalty: ${char1.name} has ${bonus} penalty (${Math.abs(difference)} tiers lower)`;
  }
  return 'Tier Bonus: Even match (no bonus)';
}

/**
 * Generate prompt for character discovery
 */
export function generateDiscoveryPrompt(
  playerCharacter: Character,
  unknownCharacter: Character,
  interactionContext: string
): string {
  return `The player character ${playerCharacter.name} is discovering information about ${unknownCharacter.name}.

Context: ${interactionContext}

Based on the interaction, reveal appropriate information about ${unknownCharacter.name}:
- Basic appearance and demeanor
- Advancement tier (if perceivable)
- Faction affiliation (if mentioned)
- Current activity/goal (if observable)

Do not reveal:
- Exact stats
- Complete timeline
- Hidden motivations (unless appropriate)

Output JSON with:
- discovered: true/false
- revealedInfo: string (what the player learns)
- newRelationship: string (how they view each other now)`;
}

/**
 * System prompt for player character creation
 */
export const PLAYER_CHARACTER_CREATION_PROMPT = `You are assisting in creating a player character for a tabletop RPG game.

Parse the player's character description and generate a complete character with:
1. Name (from player input)
2. Description (expanded from player input)
3. Advancement tier (from player input or default to Foundation)
4. Madra core with nature (from player input or Pure)
5. Starting stats appropriate for their tier
6. Starting position (choose appropriate location from world)
7. Empty timeline (player controls their own actions)
8. Mark as player character and add to party

Important:
- Be creative but consistent with player's description
- Apply appropriate stat bonuses for their advancement tier
- If they specify techniques, validate they match their tier
- Choose a logical starting location from the world map
- Set discoveredByPlayer to true for player character

Output valid JSON matching the Character schema.`;

/**
 * Generate prompt for player character creation
 */
export function generatePlayerCharacterPrompt(
  world: World,
  playerDescription: string
): string {
  const locationsList = world.map?.locations
    ? world.map.locations
        .map((loc) => `- ${loc.name} (${loc.type}) at position (${loc.position.x.toFixed(1)}, ${loc.position.y.toFixed(1)})`)
        .join('\n')
    : 'No locations defined';
    
  return `Create a player character for the world "${world.name}".

World details:
Name: ${world.name}
Description: ${world.description}

Available Starting Locations:
${locationsList}

Player's character description:
${playerDescription}

Generate a complete character JSON with:
- Name, description, and background from player input
- Advancement tier (default Foundation if not specified)
- Madra core nature (default Pure if not specified)
- Starting stats based on their tier (Foundation: 10-12 stats, 20-30 HP, AC 10-12)
- **CRITICAL: position object with x and y coordinates near one of the locations above**
- Empty inventory with basic starting items
- Empty timeline array [] (player controls their actions)
- Empty techniques array []
- isPlayerCharacter: true
- isInPlayerParty: true
- discoveredByPlayer: true

**IMPORTANT: You MUST include a valid "position" field like: { "x": 25.5, "y": 40.2 }**
Choose a starting position at or near an appropriate location from the list.

Ensure the character fits naturally into the world.`;
}

/**
 * Generate prompt for game master responses
 */
export function generateGameMasterPrompt(
  world: World,
  characters: Character[],
  playerMessage: string,
  chatHistory: Array<{ sender: string; content: string }>
): string {
  const playerCharacter = characters.find(c => c.isPlayerCharacter);
  const nearbyCharacters = characters.filter(c => 
    !c.isPlayerCharacter && 
    Math.abs(c.position.x - (playerCharacter?.position.x || 0)) < 5 &&
    Math.abs(c.position.y - (playerCharacter?.position.y || 0)) < 5
  );

  const equipment = playerCharacter?.inventory
    .filter(i => ['weapon', 'armor'].includes(i.type))
    .map(i => i.name)
    .join(', ') || 'None';

  return `You are the Game Master for "${world.name}".

Current situation:
- Player character: ${playerCharacter ? `${playerCharacter.name} (${playerCharacter.advancementTier}) at position (${playerCharacter.position?.x?.toFixed(1) ?? 'unknown'}, ${playerCharacter.position?.y?.toFixed(1) ?? 'unknown'})` : 'Not created yet'}
- HP: ${playerCharacter ? `${playerCharacter.stats?.currentHp ?? 0}/${playerCharacter.stats?.maxHp ?? 0}` : 'N/A'}
- Madra: ${playerCharacter ? `${playerCharacter.madraCore?.currentMadra ?? 0}/${playerCharacter.madraCore?.maxMadra ?? 0}` : 'N/A'}
- Equipment: ${equipment}
- Nearby characters: ${nearbyCharacters.map(c => `${c.name} (${c.advancementTier}) at (${c.position?.x?.toFixed(1) ?? '?'}, ${c.position?.y?.toFixed(1) ?? '?'})`).join(', ') || 'None'}

Recent conversation:
${chatHistory.slice(-3).map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

Player message: ${playerMessage}

As Game Master:
1. Narrate what happens based on the player's action
2. Reveal information they can perceive (based on their tier and proximity)
3. Generate encounters or events if appropriate
4. Update character states as needed
5. Keep the world feeling alive and reactive

CRITICAL RESPONSE FORMAT:
You MUST respond in TWO parts:
1. First: Engaging narrative text for the player
2. Second: A state update JSON block (if anything changes)

When the player's action causes state changes (movement, combat, looting, using items), include a state update block:

\`\`\`json
{
  "characterUpdates": [
    {
      "characterId": "${playerCharacter?.id ?? 'player-id'}",
      "updates": {
        "position": { "x": 45.5, "y": 67.2 },
        "stats": { "currentHp": 25, "currentMadra": 80 },
        "inventory": [...full updated inventory array...],
        "activity": "exploring",
        "currentGoal": "Updated goal"
      }
    }
  ]
}
\`\`\`

IMPORTANT RULES FOR STATE UPDATES:
- ONLY include the \`\`\`json block if something actually changes
- For position updates: provide the new x, y coordinates
- For inventory: provide the COMPLETE updated inventory array (not just new items)
- For stats: only include stats that changed (currentHp, currentMadra, etc.)
- For movement: calculate realistic new position based on distance/direction described
- Always use the actual character IDs: player is "${playerCharacter?.id ?? 'unknown'}"

Example response:
"As you venture north toward the mountains, the landscape becomes more rugged. You notice ancient ruins in the distance...

\`\`\`json
{
  "characterUpdates": [{
    "characterId": "${playerCharacter?.id ?? 'player-id'}",
    "updates": {
      "position": { "x": 48.0, "y": 72.5 },
      "activity": "traveling"
    }
  }]
}
\`\`\`"

Respond naturally and engagingly, advancing the story.`;
}

/**
 * Generate DALL-E prompt for world map visualization
 */
export function generateMapImagePrompt(world: World): string {
  const locationsDesc = world.map.locations
    .slice(0, 8) // Limit to avoid overly complex prompts
    .map(loc => `${loc.name} (${loc.type})`)
    .join(', ');
  
  return `Fantasy RPG world map for "${world.name}". 
${world.description}

Key locations: ${locationsDesc}

Style: Top-down fantasy map, artistic and hand-drawn style, clear terrain features, fantasy cartography, 
parchment-like texture, rivers and mountains visible, suitable for tabletop RPG, 
no text labels, no modern elements, medieval fantasy aesthetic, wide landscape format.

The map should show diverse terrain types and be suitable for placing location markers.`;
}
