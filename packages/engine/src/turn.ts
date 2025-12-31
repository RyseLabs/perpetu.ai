import {
  Character,
  World,
  TimelineEvent,
  WorldEvent,
  calculateScaleMadra,
  Item,
} from '@perpetu-ai/models';
import { TravelEngine } from './travel.js';

/**
 * Turn-based simulation engine
 */
export class TurnEngine {
  /**
   * Process a single turn for the entire world
   */
  static processTurn(
    world: World,
    characters: Character[]
  ): {
    updatedCharacters: Character[];
    triggeredEvents: TimelineEvent[];
    worldEvents: WorldEvent[];
  } {
    const currentTurn = world.currentTurn + 1;
    const triggeredEvents: TimelineEvent[] = [];
    const worldEvents: WorldEvent[] = [];
    const updatedCharacters: Character[] = [];
    
    const mapDiagonal = Math.sqrt(
      world.map.width ** 2 + world.map.height ** 2
    );
    
    for (const character of characters) {
      let updated = { ...character };
      
      // Check for timeline events at this turn
      const dueEvents = character.timeline.filter(
        event => event.turn === currentTurn && !event.completed
      );
      
      for (const event of dueEvents) {
        // Process event based on type
        switch (event.action) {
          case 'move':
            if (event.targetLocation) {
              updated = this.processMovement(
                updated,
                event.targetLocation,
                mapDiagonal
              );
            }
            break;
            
          case 'train':
            updated = this.processTraining(updated);
            break;
            
          // Other event types can be added here
        }
        
        // Mark event as completed
        event.completed = true;
        triggeredEvents.push(event);
        
        // Create world event
        worldEvents.push({
          id: `event-${currentTurn}-${character.id}-${event.id}`,
          turn: currentTurn,
          type: event.action === 'combat' ? 'combat' : 'custom',
          involvedCharacterIds: [character.id],
          location: updated.position,
          description: event.description,
          timestamp: Date.now(),
        });
      }
      
      // Regenerate madra (5% per turn while resting)
      if (updated.activity === 'resting') {
        const regenAmount = Math.floor(updated.madraCore.maxMadra * 0.05);
        updated.madraCore.currentMadra = Math.min(
          updated.madraCore.maxMadra,
          updated.madraCore.currentMadra + regenAmount
        );
      }
      
      // Check for nearby characters (potential interactions)
      const nearby = TravelEngine.findNearbyCharacters(
        updated,
        characters,
        mapDiagonal
      );
      
      if (nearby.length > 0 && updated.activity !== 'combat') {
        // Potential encounter
        worldEvents.push({
          id: `encounter-${currentTurn}-${character.id}`,
          turn: currentTurn,
          type: 'interaction',
          involvedCharacterIds: [character.id, ...nearby.map(c => c.id)],
          location: updated.position,
          description: `${character.name} encounters ${nearby.map(c => c.name).join(', ')}`,
          timestamp: Date.now(),
        });
      }
      
      updated.lastUpdated = Date.now();
      updatedCharacters.push(updated);
    }
    
    return {
      updatedCharacters,
      triggeredEvents,
      worldEvents,
    };
  }
  
  /**
   * Process character movement toward goal
   */
  private static processMovement(
    character: Character,
    targetPosition: { x: number; y: number },
    mapDiagonal: number
  ): Character {
    const newPosition = TravelEngine.moveToward(
      character,
      targetPosition,
      mapDiagonal
    );
    
    return {
      ...character,
      position: newPosition,
      activity: 'traveling',
    };
  }
  
  /**
   * Process training activity
   */
  private static processTraining(character: Character): Character {
    // Improve technique proficiency
    const updatedTechniques = character.techniques.map(technique => ({
      ...technique,
      proficiency: Math.min(100, technique.proficiency + 1),
    }));
    
    // Small madra capacity increase (0.1%)
    const capacityIncrease = character.madraCore.maxMadra * 0.001;
    
    return {
      ...character,
      techniques: updatedTechniques,
      madraCore: {
        ...character.madraCore,
        maxMadra: character.madraCore.maxMadra + capacityIncrease,
      },
      activity: 'training',
    };
  }
  
  /**
   * Process scale cycling (advancement resource)
   */
  static cycleScale(character: Character, scale: Item): {
    character: Character;
    advanced: boolean;
    newTier?: string;
  } {
    if (scale.type !== 'scale' || !scale.properties?.madra) {
      throw new Error('Invalid scale item');
    }
    
    const scaleMadra = scale.properties.madra as number;
    let newMadra = character.madraCore.currentMadra + scaleMadra;
    let capacityIncrease = 0;
    
    // Overflow increases capacity
    if (newMadra > character.madraCore.maxMadra) {
      capacityIncrease = newMadra - character.madraCore.maxMadra;
      newMadra = character.madraCore.maxMadra;
    }
    
    const newMaxMadra = character.madraCore.maxMadra + capacityIncrease;
    
    // Check for advancement (capacity threshold met)
    // This would need to check against tier thresholds
    const advanced = false; // TODO: Implement tier advancement logic
    
    return {
      character: {
        ...character,
        madraCore: {
          ...character.madraCore,
          currentMadra: newMadra,
          maxMadra: newMaxMadra,
        },
        inventory: character.inventory.filter(item => item.id !== scale.id),
      },
      advanced,
    };
  }
  
  /**
   * Generate scale drop from defeated enemy
   */
  static generateScaleDrop(defeatedEnemy: Character): Item {
    const scaleMadra = calculateScaleMadra(defeatedEnemy.madraCore.currentMadra);
    
    return {
      id: `scale-${defeatedEnemy.id}-${Date.now()}`,
      name: `${defeatedEnemy.madraCore.nature} Scale`,
      description: `A scale containing ${defeatedEnemy.madraCore.nature} madra from ${defeatedEnemy.name}`,
      type: 'scale',
      quantity: 1,
      properties: {
        madra: scaleMadra,
        nature: defeatedEnemy.madraCore.nature,
        sourceTier: defeatedEnemy.advancementTier,
      },
    };
  }
}
