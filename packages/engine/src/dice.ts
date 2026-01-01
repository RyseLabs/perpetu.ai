import { DiceRoll } from '@perpetu-ai/models';

/**
 * Dice rolling engine for deterministic combat
 * Uses seeded random for reproducibility
 */
export class DiceEngine {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed || Date.now();
  }
  
  /**
   * Seeded random number generator (LCG algorithm)
   */
  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  /**
   * Roll dice with modifiers
   */
  roll(diceType: number, numDice: number, modifier: number = 0): DiceRoll {
    const results: number[] = [];
    
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(this.random() * diceType) + 1;
      results.push(roll);
    }
    
    const sum = results.reduce((a, b) => a + b, 0);
    const total = sum + modifier;
    
    // Check for critical hit (natural 20 on d20) or critical fail (natural 1)
    const criticalHit = diceType === 20 && numDice === 1 && results[0] === 20;
    const criticalFail = diceType === 20 && numDice === 1 && results[0] === 1;
    
    return {
      diceType,
      numDice,
      results,
      modifier,
      total,
      criticalHit,
      criticalFail,
    };
  }
  
  /**
   * Roll with advantage (roll twice, take higher)
   */
  rollAdvantage(diceType: number, modifier: number = 0): DiceRoll {
    const roll1 = this.roll(diceType, 1, 0);
    const roll2 = this.roll(diceType, 1, 0);
    
    const betterRoll = roll1.results[0]! > roll2.results[0]! ? roll1 : roll2;
    
    return {
      ...betterRoll,
      modifier,
      total: betterRoll.results[0]! + modifier,
    };
  }
  
  /**
   * Roll with disadvantage (roll twice, take lower)
   */
  rollDisadvantage(diceType: number, modifier: number = 0): DiceRoll {
    const roll1 = this.roll(diceType, 1, 0);
    const roll2 = this.roll(diceType, 1, 0);
    
    const worseRoll = roll1.results[0]! < roll2.results[0]! ? roll1 : roll2;
    
    return {
      ...worseRoll,
      modifier,
      total: worseRoll.results[0]! + modifier,
    };
  }
  
  /**
   * Calculate ability modifier from ability score (D&D 5e)
   */
  static getAbilityModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2);
  }
  
  /**
   * Set new seed for reproducibility
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }
}
