import {
  Character,
  CombatAction,
  CombatResult,
  CombatRound,
  calculateTierBonus,
} from '@perpetu-ai/models';
import { DiceEngine } from './dice.js';

/**
 * Combat engine implementing D&D 5e mechanics with advancement tiers
 */
export class CombatEngine {
  private diceEngine: DiceEngine;
  
  constructor(seed?: number) {
    this.diceEngine = new DiceEngine(seed);
  }
  
  /**
   * Resolve a combat action
   */
  resolveCombatAction(
    action: CombatAction,
    actor: Character,
    target?: Character
  ): CombatResult {
    switch (action.actionType) {
      case 'attack':
        return this.resolveAttack(actor, target!);
      case 'cast_technique':
        return this.resolveTechnique(action, actor, target!);
      case 'defend':
        return this.resolveDefend(actor);
      case 'dodge':
        return this.resolveDodge(actor);
      default:
        return {
          action,
          success: false,
          description: 'Invalid action',
          effects: [],
        };
    }
  }
  
  /**
   * Resolve basic attack
   */
  private resolveAttack(attacker: Character, defender: Character): CombatResult {
    // Calculate tier bonus
    const tierBonus = calculateTierBonus(
      attacker.advancementTier,
      defender.advancementTier
    );
    
    // Calculate attack modifier (Strength + proficiency + tier bonus)
    const strMod = DiceEngine.getAbilityModifier(attacker.stats.strength);
    const proficiencyBonus = 2; // Simplified for POC
    const attackModifier = strMod + proficiencyBonus + tierBonus;
    
    // Roll to hit
    const attackRoll = this.diceEngine.roll(20, 1, attackModifier);
    const hits = attackRoll.total >= defender.stats.armorClass || attackRoll.criticalHit;
    
    let damage = 0;
    let damageRoll;
    
    if (hits) {
      // Roll damage (1d8 + Strength modifier for basic attack)
      damageRoll = this.diceEngine.roll(8, 1, strMod);
      damage = Math.max(1, damageRoll.total);
      
      // Critical hit doubles dice
      if (attackRoll.criticalHit) {
        damage += this.diceEngine.roll(8, 1, 0).total;
      }
    }
    
    const effects: string[] = [];
    if (attackRoll.criticalHit) effects.push('Critical Hit!');
    if (attackRoll.criticalFail) effects.push('Critical Failure!');
    
    return {
      action: {
        actorId: attacker.id,
        actionType: 'attack',
        targetId: defender.id,
      },
      roll: attackRoll,
      success: hits,
      damage,
      effects,
      description: hits
        ? `${attacker.name} hits ${defender.name} for ${damage} damage! (Roll: ${attackRoll.total} vs AC ${defender.stats.armorClass})`
        : `${attacker.name} misses ${defender.name}! (Roll: ${attackRoll.total} vs AC ${defender.stats.armorClass})`,
    };
  }
  
  /**
   * Resolve technique casting
   */
  private resolveTechnique(
    action: CombatAction,
    caster: Character,
    target: Character
  ): CombatResult {
    const technique = caster.techniques.find(t => t.id === action.techniqueId);
    
    if (!technique) {
      return {
        action,
        success: false,
        description: 'Technique not found',
        effects: [],
      };
    }
    
    // Check madra cost
    if (caster.madraCore.currentMadra < technique.madraCost) {
      return {
        action,
        success: false,
        description: `${caster.name} does not have enough madra! (${caster.madraCore.currentMadra}/${technique.madraCost} needed)`,
        effects: [],
      };
    }
    
    // Calculate tier bonus
    const tierBonus = calculateTierBonus(
      caster.advancementTier,
      target.advancementTier
    );
    
    // Roll to hit (using Intelligence or Wisdom for techniques)
    const castingMod = DiceEngine.getAbilityModifier(caster.stats.intelligence);
    const proficiencyBonus = 2;
    const attackModifier = castingMod + proficiencyBonus + tierBonus;
    
    const attackRoll = this.diceEngine.roll(20, 1, attackModifier);
    const hits = attackRoll.total >= target.stats.armorClass;
    
    let damage = 0;
    const effects: string[] = [];
    
    if (hits) {
      // Technique damage scales with proficiency and tier
      const baseDamage = technique.proficiency / 10;
      const damageRoll = this.diceEngine.roll(10, 2, Math.floor(baseDamage));
      damage = damageRoll.total;
      
      // Apply madra nature effects
      effects.push(`${technique.nature} technique effect`);
    }
    
    return {
      action,
      roll: attackRoll,
      success: hits,
      damage,
      madraCost: technique.madraCost,
      effects,
      description: hits
        ? `${caster.name} casts ${technique.name} on ${target.name} for ${damage} damage!`
        : `${caster.name}'s ${technique.name} misses ${target.name}!`,
    };
  }
  
  /**
   * Resolve defend action (increases AC temporarily)
   */
  private resolveDefend(character: Character): CombatResult {
    return {
      action: {
        actorId: character.id,
        actionType: 'defend',
      },
      success: true,
      effects: ['AC +2 until next turn'],
      description: `${character.name} takes a defensive stance!`,
    };
  }
  
  /**
   * Resolve dodge action (grants advantage on dexterity saves)
   */
  private resolveDodge(character: Character): CombatResult {
    return {
      action: {
        actorId: character.id,
        actionType: 'dodge',
      },
      success: true,
      effects: ['Attacks against you have disadvantage until next turn'],
      description: `${character.name} prepares to dodge!`,
    };
  }
  
  /**
   * Calculate initiative order
   */
  calculateInitiative(characters: Character[]): string[] {
    const initiatives = characters.map(char => ({
      id: char.id,
      initiative: this.diceEngine.roll(
        20,
        1,
        DiceEngine.getAbilityModifier(char.stats.dexterity)
      ).total,
    }));
    
    // Sort by initiative (highest first)
    initiatives.sort((a, b) => b.initiative - a.initiative);
    
    return initiatives.map(i => i.id);
  }
}
