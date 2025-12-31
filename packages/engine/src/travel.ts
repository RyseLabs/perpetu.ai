import {
  Character,
  Position,
  calculatePerceptionRange,
  calculateTravelSpeed,
} from '@perpetu-ai/models';

/**
 * Travel and movement engine
 */
export class TravelEngine {
  /**
   * Calculate distance between two positions
   */
  static calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate if a character can perceive another based on advancement tier
   * @param observer The character trying to perceive
   * @param target The character being perceived
   * @param mapDiagonal The diagonal distance across the map
   * @returns true if observer can perceive target
   */
  static canPerceive(
    observer: Character,
    target: Character,
    mapDiagonal: number
  ): boolean {
    const distance = this.calculateDistance(observer.position, target.position);
    const perceptionRange = calculatePerceptionRange(observer.advancementTier);
    const maxDistance = mapDiagonal * perceptionRange;
    
    return distance <= maxDistance;
  }
  
  /**
   * Move character toward target position based on travel speed
   * @param character Character to move
   * @param targetPosition Destination
   * @param mapDiagonal Diagonal distance across the map (for normalizing speed)
   * @returns New position after movement
   */
  static moveToward(
    character: Character,
    targetPosition: Position,
    mapDiagonal: number
  ): Position {
    const travelSpeed = calculateTravelSpeed(character.advancementTier);
    
    // Instant travel for Monarchs
    if (travelSpeed === Infinity) {
      return { ...targetPosition };
    }
    
    // Calculate how far they can move this turn (one turn = one day)
    const maxMovement = mapDiagonal * travelSpeed;
    
    const currentDistance = this.calculateDistance(
      character.position,
      targetPosition
    );
    
    // Already at destination
    if (currentDistance <= maxMovement) {
      return { ...targetPosition };
    }
    
    // Move toward target
    const direction = {
      x: (targetPosition.x - character.position.x) / currentDistance,
      y: (targetPosition.y - character.position.y) / currentDistance,
    };
    
    return {
      x: character.position.x + direction.x * maxMovement,
      y: character.position.y + direction.y * maxMovement,
    };
  }
  
  /**
   * Check if two characters are close enough to interact
   * (within 1% of map diagonal distance)
   */
  static canInteract(
    char1: Character,
    char2: Character,
    mapDiagonal: number
  ): boolean {
    const distance = this.calculateDistance(char1.position, char2.position);
    const interactionRange = mapDiagonal * 0.01; // 1% of map
    return distance <= interactionRange;
  }
  
  /**
   * Find all characters within interaction range
   */
  static findNearbyCharacters(
    character: Character,
    allCharacters: Character[],
    mapDiagonal: number
  ): Character[] {
    return allCharacters.filter(
      other =>
        other.id !== character.id &&
        this.canInteract(character, other, mapDiagonal)
    );
  }
  
  /**
   * Calculate time (in turns) to travel between two points
   */
  static calculateTravelTime(
    character: Character,
    from: Position,
    to: Position,
    mapDiagonal: number
  ): number {
    const travelSpeed = calculateTravelSpeed(character.advancementTier);
    
    if (travelSpeed === Infinity) return 0;
    
    const distance = this.calculateDistance(from, to);
    const maxMovementPerTurn = mapDiagonal * travelSpeed;
    
    return Math.ceil(distance / maxMovementPerTurn);
  }
}
