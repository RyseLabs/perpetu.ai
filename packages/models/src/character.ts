import { z } from 'zod';
import { AdvancementTier } from './advancement.js';
import { MadraCore, Technique } from './madra.js';

/**
 * Character position on the map
 */
export const Position = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof Position>;

/**
 * Character stats
 */
export const CharacterStats = z.object({
  // D&D 5e base stats
  strength: z.number().min(1).max(30).default(10),
  dexterity: z.number().min(1).max(30).default(10),
  constitution: z.number().min(1).max(30).default(10),
  intelligence: z.number().min(1).max(30).default(10),
  wisdom: z.number().min(1).max(30).default(10),
  charisma: z.number().min(1).max(30).default(10),
  
  // Combat stats
  maxHp: z.number().positive(),
  currentHp: z.number().min(0),
  armorClass: z.number().positive().default(10),
  initiative: z.number().default(0),
  
  // Advancement tier bonus (calculated from tier difference)
  tierBonus: z.number().default(0),
});

export type CharacterStats = z.infer<typeof CharacterStats>;

/**
 * Inventory item
 */
export const Item = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['weapon', 'armor', 'consumable', 'quest', 'scale', 'other']),
  quantity: z.number().positive().default(1),
  properties: z.record(z.any()).optional(),
});

export type Item = z.infer<typeof Item>;

/**
 * Timeline event for NPC autonomous behavior
 */
export const TimelineEvent = z.object({
  id: z.string(),
  turn: z.number().positive(), // Turn when this event should trigger
  description: z.string(),
  action: z.enum(['move', 'combat', 'interact', 'train', 'custom']),
  targetLocation: Position.optional(),
  targetCharacterId: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.number().min(1).max(10).default(5),
});

export type TimelineEvent = z.infer<typeof TimelineEvent>;

/**
 * Character activity state
 */
export const Activity = z.enum([
  'idle',
  'traveling',
  'combat',
  'training',
  'resting',
  'interacting',
  'custom',
]);

export type Activity = z.infer<typeof Activity>;

/**
 * Full character schema
 */
export const Character = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Advancement and madra
  advancementTier: AdvancementTier,
  madraCore: MadraCore,
  techniques: z.array(Technique).default([]),
  
  // Stats and combat
  stats: CharacterStats,
  inventory: z.array(Item).default([]),
  
  // World state
  position: Position,
  activity: Activity.default('idle'),
  currentGoal: z.string().optional(),
  timeline: z.array(TimelineEvent).default([]),
  
  // Relationships
  faction: z.string().optional(),
  isPlayerCharacter: z.boolean().default(false),
  isInPlayerParty: z.boolean().default(false),
  discoveredByPlayer: z.boolean().default(false),
  
  // Teacher/mentor for technique learning
  teacherId: z.string().optional(),
  
  // Metadata
  createdAt: z.number(), // Unix timestamp
  lastUpdated: z.number(), // Unix timestamp
});

export type Character = z.infer<typeof Character>;

/**
 * Combat action types
 */
export const CombatActionType = z.enum([
  'attack',
  'cast_technique',
  'defend',
  'move',
  'use_item',
  'dodge',
  'end_turn',
]);

export type CombatActionType = z.infer<typeof CombatActionType>;

/**
 * Combat action for MCP protocol
 */
export const CombatAction = z.object({
  actorId: z.string(),
  actionType: CombatActionType,
  targetId: z.string().optional(),
  techniqueId: z.string().optional(),
  itemId: z.string().optional(),
  position: Position.optional(),
});

export type CombatAction = z.infer<typeof CombatAction>;

/**
 * Dice roll result
 */
export const DiceRoll = z.object({
  diceType: z.number(), // e.g., 20 for d20
  numDice: z.number().positive(),
  results: z.array(z.number()),
  modifier: z.number().default(0),
  total: z.number(),
  criticalHit: z.boolean().default(false),
  criticalFail: z.boolean().default(false),
});

export type DiceRoll = z.infer<typeof DiceRoll>;

/**
 * Combat result for a single action
 */
export const CombatResult = z.object({
  action: CombatAction,
  roll: DiceRoll.optional(),
  success: z.boolean(),
  damage: z.number().default(0),
  madraCost: z.number().default(0),
  effects: z.array(z.string()).default([]),
  description: z.string(),
});

export type CombatResult = z.infer<typeof CombatResult>;

/**
 * Full combat round results
 */
export const CombatRound = z.object({
  roundNumber: z.number().positive(),
  results: z.array(CombatResult),
  participants: z.array(z.string()), // Character IDs
  turnOrder: z.array(z.string()), // Character IDs in initiative order
});

export type CombatRound = z.infer<typeof CombatRound>;
