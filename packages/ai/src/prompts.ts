import type { Character, World, WorldMap, Location } from '@perpetu-ai/models';

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

Generate a JSON response with:
1. World metadata (name, description)
2. Map dimensions (width, height in map units)
3. Locations array with:
   - Name, description, type, position
   - Faction ownership if applicable
4. Characters array (limit to 10-20 key characters) with:
   - Name, description
   - Advancement tier (realistic distribution)
   - Madra core (nature, capacity based on tier)
   - Starting position on map
   - Faction affiliation
   - 3-5 timeline events with specific turn numbers
   - Initial stats appropriate for their tier

Ensure the world feels alive with characters having their own goals and motivations.`;
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

Important rules:
- Only reveal information the player can perceive based on their advancement tier
- Higher-tier NPCs can perceive and react to distant events
- Combat uses D&D 5e mechanics + advancement tier bonuses
- Characters gain strength by defeating enemies and cycling scales
- Time advances each turn, triggering timeline events
- NPCs move autonomously toward their goals

Advancement system:
- Each tier difference = ±3 bonus in combat
- Perception range scales with advancement (Monarch sees entire map)
- Travel speed scales with advancement (Monarch travels instantly)

Always output deterministic, schema-validated JSON for game state updates.`;

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
