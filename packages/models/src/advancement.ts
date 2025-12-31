import { z } from 'zod';

/**
 * Advancement tiers from Foundation to Monarch
 * Each tier provides +3/-3 bonus per tier difference in combat
 */
export const AdvancementTier = z.enum([
  'Foundation',
  'Iron',
  'Jade',
  'LowGold',
  'HighGold',
  'TrueGold',
  'Underlord',
  'Overlord',
  'Archlord',
  'Herald',
  'Sage',
  'Monarch',
]);

export type AdvancementTier = z.infer<typeof AdvancementTier>;

/**
 * Tier levels for calculating bonuses and differences
 */
export const ADVANCEMENT_TIER_LEVELS: Record<AdvancementTier, number> = {
  Foundation: 0,
  Iron: 1,
  Jade: 2,
  LowGold: 3,
  HighGold: 4,
  TrueGold: 5,
  Underlord: 6,
  Overlord: 7,
  Archlord: 8,
  Herald: 9,
  Sage: 9,
  Monarch: 10,
};

/**
 * Calculate combat bonus based on advancement tier difference
 * @param tier1 First character's tier
 * @param tier2 Second character's tier
 * @returns Bonus for tier1 character (+3 per tier above, -3 per tier below)
 */
export function calculateTierBonus(tier1: AdvancementTier, tier2: AdvancementTier): number {
  const level1 = ADVANCEMENT_TIER_LEVELS[tier1];
  const level2 = ADVANCEMENT_TIER_LEVELS[tier2];
  return (level1 - level2) * 3;
}

/**
 * Calculate perception range as fraction of map (1.0 = full map)
 */
export function calculatePerceptionRange(tier: AdvancementTier): number {
  const level = ADVANCEMENT_TIER_LEVELS[tier];
  if (level >= 10) return 1.0; // Monarch sees entire map
  if (level >= 8) return 0.5; // Archlord/Herald/Sage sees half
  if (level >= 7) return 0.25; // Overlord sees 1/4
  if (level >= 6) return 0.125; // Underlord sees 1/8
  if (level >= 5) return 0.0625; // TrueGold sees 1/16
  if (level >= 3) return 0.03125; // Gold tiers see 1/32
  if (level >= 2) return 0.015625; // Jade sees 1/64
  if (level >= 1) return 0.0078125; // Iron sees 1/128
  return 0.00390625; // Foundation sees 1/256
}

/**
 * Calculate travel speed as fraction of map per day
 */
export function calculateTravelSpeed(tier: AdvancementTier): number {
  const level = ADVANCEMENT_TIER_LEVELS[tier];
  if (level >= 10) return Infinity; // Monarch travels instantly
  if (level >= 8) return 0.5; // Archlord/Herald/Sage travels half map per day
  if (level >= 7) return 0.25; // Overlord travels 1/4 map per day
  if (level >= 6) return 0.125; // Underlord travels 1/8 map per day
  if (level >= 5) return 0.0625; // TrueGold travels 1/16 map per day
  if (level >= 3) return 0.03125; // Gold tiers travel 1/32 map per day
  if (level >= 2) return 0.015625; // Jade travels 1/64 map per day
  if (level >= 1) return 0.0078125; // Iron travels 1/128 map per day
  return 0.00390625; // Foundation travels 1/256 map per day
}
