import { z } from 'zod';

/**
 * Madra natures/aspects that determine technique types and effects
 */
export const MadraNature = z.enum([
  'Pure',
  'Earth',
  'Wind',
  'Fire',
  'Water',
  'Ice',
  'Cloud',
  'Force',
  'Poison',
  'Life',
  'Blood',
  'Hunger',
  'Light',
  'Heat',
  'Dream',
  'Shadow',
  'Sword',
  'Destruction',
  'Death',
  'Connection',
]);

export type MadraNature = z.infer<typeof MadraNature>;

/**
 * Descriptions and mechanical effects of each madra nature
 */
export const MADRA_NATURE_EFFECTS: Record<MadraNature, {
  description: string;
  strengths: string[];
  weaknesses: string[];
}> = {
  Pure: {
    description: 'Natural madra that everyone starts with. Highly versatile.',
    strengths: ['Disrupts enemy madra cycling', 'Can overload channels', 'Temporarily disable techniques'],
    weaknesses: ['Less specialized damage'],
  },
  Earth: {
    description: 'Heavy, stable madra for defense and structure.',
    strengths: ['Strong reinforcement', 'Barriers and fortifications', 'Extreme durability'],
    weaknesses: ['Slow movement', 'Limited offense'],
  },
  Wind: {
    description: 'Light, fast madra for speed and cutting force.',
    strengths: ['Enhanced agility', 'Flight', 'Difficult to track'],
    weaknesses: ['Low durability', 'Less defensive power'],
  },
  Fire: {
    description: 'Aggressive, volatile madra for destruction.',
    strengths: ['High offense', 'Explosions', 'Burning damage'],
    weaknesses: ['High madra consumption', 'Difficult to control'],
  },
  Water: {
    description: 'Fluid, adaptive madra for control and endurance.',
    strengths: ['Binding techniques', 'Erosion', 'Quick recovery'],
    weaknesses: ['Moderate direct damage'],
  },
  Ice: {
    description: 'Refined water madra emphasizing control and immobilization.',
    strengths: ['Slowing effects', 'Battlefield denial', 'Precision attacks'],
    weaknesses: ['Brittle under force attacks'],
  },
  Cloud: {
    description: 'Diffuse madra for concealment and area control.',
    strengths: ['Obscuring senses', 'Mobility', 'Wide-range techniques'],
    weaknesses: ['Low direct damage'],
  },
  Force: {
    description: 'Direct kinetic madra for impact and momentum.',
    strengths: ['Blunt attacks', 'Shockwaves', 'Physical reinforcement'],
    weaknesses: ['Less effective against incorporeal targets'],
  },
  Poison: {
    description: 'Corrosive madra that weakens over time.',
    strengths: ['Disrupts channels', 'Stacking damage', 'Persistent effects'],
    weaknesses: ['Slow initial damage', 'Can be resisted'],
  },
  Life: {
    description: 'Vital madra for healing and growth.',
    strengths: ['Regeneration', 'Body strengthening', 'Support abilities'],
    weaknesses: ['Limited offensive capability'],
  },
  Blood: {
    description: 'Madra tied to flesh and vitality.',
    strengths: ['Body reinforcement', 'Regeneration', 'Manipulate living targets'],
    weaknesses: ['Less effective vs non-living'],
  },
  Hunger: {
    description: 'Forbidden madra that devours other madra.',
    strengths: ['Devours madra and essence', 'Permanently weakens victims', 'Empowers user'],
    weaknesses: ['Corrupting influence', 'Forbidden/restricted'],
  },
  Light: {
    description: 'Fast, precise madra for speed and clarity.',
    strengths: ['High velocity strikes', 'Illusions', 'Blinding techniques'],
    weaknesses: ['Less effective in darkness'],
  },
  Heat: {
    description: 'Refined fire aspect focused on temperature.',
    strengths: ['Melting materials', 'Bypasses defenses', 'No explosive force'],
    weaknesses: ['Requires sustained contact'],
  },
  Dream: {
    description: 'Mental madra affecting perception and consciousness.',
    strengths: ['Illusions', 'Mind attacks', 'Disrupts focus'],
    weaknesses: ['Less effective vs strong will', 'No physical damage'],
  },
  Shadow: {
    description: 'Subtle madra for concealment and indirect attacks.',
    strengths: ['Stealth', 'Ambushes', 'Avoids detection'],
    weaknesses: ['Less effective in bright light'],
  },
  Sword: {
    description: 'Sharp madra specialized for cutting.',
    strengths: ['Precision strikes', 'Clean cuts', 'Overwhelming defenses'],
    weaknesses: ['Requires skill and focus'],
  },
  Destruction: {
    description: 'Chaotic madra that annihilates indiscriminately.',
    strengths: ['Extreme power', 'Destroys matter and madra', 'Bypasses most defenses'],
    weaknesses: ['Unstable', 'Damages user', 'Difficult to control'],
  },
  Death: {
    description: 'Entropic madra tied to decay and endings.',
    strengths: ['Weakens life', 'Halts regeneration', 'Kills techniques'],
    weaknesses: ['Less direct damage', 'Long-term effects'],
  },
  Connection: {
    description: 'Rare madra governing bonds and relationships.',
    strengths: ['Binding', 'Power sharing', 'Control constructs', 'Fate manipulation'],
    weaknesses: ['Rare and difficult to learn'],
  },
};

/**
 * Madra core schema representing a character's madra reservoir
 */
export const MadraCore = z.object({
  nature: MadraNature,
  currentMadra: z.number().min(0),
  maxMadra: z.number().positive(),
  tier: z.string(), // References AdvancementTier
});

export type MadraCore = z.infer<typeof MadraCore>;

/**
 * Calculate base madra capacity for an advancement tier
 * Exponential growth per tier
 */
export function calculateBaseMadraCapacity(tierLevel: number): number {
  // Base capacity grows exponentially: 100 * (2 ^ tierLevel)
  return 100 * Math.pow(2, tierLevel);
}

/**
 * Calculate scale madra content (1/20 to 1/30 of remaining core)
 */
export function calculateScaleMadra(enemyRemainingMadra: number): number {
  const minFraction = 1 / 30;
  const maxFraction = 1 / 20;
  const fraction = minFraction + Math.random() * (maxFraction - minFraction);
  return Math.floor(enemyRemainingMadra * fraction);
}

/**
 * Technique schema
 */
export const Technique = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nature: MadraNature,
  requiredTier: z.string(), // References AdvancementTier
  madraCost: z.number().positive(),
  proficiency: z.number().min(0).max(100).default(0), // 0-100, improves with use
  cooldown: z.number().min(0).default(0), // Turns until usable again
});

export type Technique = z.infer<typeof Technique>;
