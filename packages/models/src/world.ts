import { z } from 'zod';
import { Position } from './character.js';

/**
 * Location on the world map
 */
export const Location = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  position: Position,
  type: z.enum(['city', 'town', 'dungeon', 'landmark', 'wilderness', 'other']),
  discoveredByPlayer: z.boolean().default(false),
  faction: z.string().optional(),
});

export type Location = z.infer<typeof Location>;

/**
 * World map dimensions and metadata
 */
export const WorldMap = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  locations: z.array(Location).default([]),
  backgroundImageUrl: z.string().optional(),
  createdAt: z.number(),
});

export type WorldMap = z.infer<typeof WorldMap>;

/**
 * Game world state
 */
export const World = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  map: WorldMap,
  currentTurn: z.number().min(0).default(0),
  characterIds: z.array(z.string()).default([]),
  factions: z.array(z.string()).default([]),
  createdAt: z.number(),
  lastUpdated: z.number(),
});

export type World = z.infer<typeof World>;

/**
 * Event that occurs in the world
 */
export const WorldEvent = z.object({
  id: z.string(),
  turn: z.number(),
  type: z.enum(['combat', 'discovery', 'interaction', 'advancement', 'death', 'custom']),
  involvedCharacterIds: z.array(z.string()),
  location: Position,
  description: z.string(),
  timestamp: z.number(),
});

export type WorldEvent = z.infer<typeof WorldEvent>;

/**
 * Chat message in a world
 */
export const ChatMessage = z.object({
  id: z.string(),
  sender: z.enum(['player', 'gm', 'system']),
  content: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessage>;
