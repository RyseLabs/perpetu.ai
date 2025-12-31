import React, { useState } from 'react';
import ReactFlow, {
  Node,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGameStore } from '../store/gameStore';
import type { Location } from '@perpetu-ai/models';

/**
 * Calculate distance between two points
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Custom node component for characters on the map
 */
const CharacterNode: React.FC<{ data: any }> = ({ data }) => {
  const { setSelectedCharacter } = useGameStore();
  const character = data.character;
  
  // Safe access with fallbacks
  const name = character?.name || 'Unknown';
  const tier = character?.advancementTier || 'Unknown';
  const isDiscovered = character?.discoveredByPlayer || false;
  const isPlayer = character?.isPlayerCharacter || false;
  const isInParty = character?.isInPlayerParty || false;
  const avatarUrl = character?.avatarUrl;
  
  return (
    <div className="relative">
      {/* Avatar overlay - positioned above the main node */}
      {avatarUrl && (
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <img 
            src={avatarUrl}
            alt={name}
            className="w-10 h-10 rounded-full border-2 object-cover shadow-md"
            style={{
              borderColor: isInParty ? '#6366f1' : isPlayer ? '#10b981' : '#fbbf24',
            }}
          />
        </div>
      )}
      
      {/* Character node */}
      <div
        onClick={() => setSelectedCharacter(character)}
        className="cursor-pointer bg-panel-bg border-2 border-accent rounded-lg p-2 min-w-[100px] hover:bg-panel-border transition-colors shadow-lg"
        style={{
          borderColor: isInParty ? '#6366f1' : isPlayer ? '#10b981' : '#2a2a2a',
        }}
      >
        <div className="text-xs font-bold truncate">
          {isDiscovered ? name : 'Unknown'}
        </div>
        <div className="text-xs text-text-secondary">
          {tier}
        </div>
        {isPlayer && (
          <div className="text-xs text-green-400 font-bold">★ You</div>
        )}
      </div>
    </div>
  );
};

/**
 * Custom node component for locations on the map
 */
const LocationNode: React.FC<{ data: any }> = ({ data }) => {
  const { setSelectedLocation, characters } = useGameStore();
  const location: Location = data.location;
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Calculate distance from player
  const playerCharacter = characters.find(c => c.isPlayerCharacter);
  const distance = playerCharacter && playerCharacter.position
    ? calculateDistance(
        playerCharacter.position.x,
        playerCharacter.position.y,
        location.position.x,
        location.position.y
      ).toFixed(1)
    : 'N/A';
  
  const locationTypeColors: Record<string, string> = {
    city: '#fbbf24',
    town: '#a78bfa',
    dungeon: '#ef4444',
    landmark: '#3b82f6',
    wilderness: '#10b981',
    other: '#6b7280',
  };
  
  const locationTypeIcons: Record<string, string> = {
    city: '🏰',
    town: '🏘️',
    dungeon: '⚔️',
    landmark: '⭐',
    wilderness: '🌲',
    other: '📍',
  };
  
  const locationType = location.type || 'other';
  const locationName = location.name || 'Unknown Location';
  
  return (
    <div
      onClick={() => setSelectedLocation(location)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="cursor-pointer relative"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform"
        style={{ backgroundColor: locationTypeColors[locationType] || '#6b7280' }}
      >
        <span className="text-lg">{locationTypeIcons[locationType] || '📍'}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-panel-bg border border-panel-border rounded-lg p-2 shadow-xl z-50 whitespace-nowrap">
          <div className="text-xs font-bold text-accent">{locationName}</div>
          <div className="text-xs text-text-secondary capitalize">{locationType}</div>
          {playerCharacter && playerCharacter.position && (
            <div className="text-xs text-text-secondary">Distance: {distance} units</div>
          )}
        </div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  character: CharacterNode,
  location: LocationNode,
};

/**
 * Map view component with draggable, zoomable world map
 */
export const MapView: React.FC = () => {
  const { world, characters } = useGameStore();
  
  // Debug logging
  React.useEffect(() => {
    console.log('MapView - World:', world);
    console.log('MapView - Characters:', characters);
  }, [world, characters]);
  
  // Convert characters and locations to React Flow nodes
  const characterNodes: Node[] = Array.isArray(characters)
    ? characters
        .filter((character) => character?.position && typeof character.position.x === 'number' && typeof character.position.y === 'number')
        .map((character) => ({
          id: `char-${character.id}`,
          type: 'character',
          position: { x: character.position.x * 100, y: character.position.y * 100 },
          data: { character },
        }))
    : [];
  
  const locationNodes: Node[] = world?.map?.locations && Array.isArray(world.map.locations)
    ? world.map.locations
        .filter((location) => location?.position && typeof location.position.x === 'number' && typeof location.position.y === 'number')
        .map((location) => ({
          id: `loc-${location.id}`,
          type: 'location',
          position: { x: location.position.x * 100, y: location.position.y * 100 },
          data: { location },
        }))
    : [];
  
  const allNodes = [...characterNodes, ...locationNodes];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [, , onEdgesChange] = useEdgesState([]);
  
  // Update nodes when characters or locations change
  React.useEffect(() => {
    const newCharacterNodes: Node[] = Array.isArray(characters)
      ? characters
          .filter((character) => {
            // Only validate position - show ALL characters with valid positions
            // Discovery is handled in the InfoPanel, not on the map
            if (!character || !character.position || typeof character.position.x !== 'number' || typeof character.position.y !== 'number') {
              if (character) {
                console.warn('Character missing valid position:', character.name, character.position);
              }
              return false;
            }
            return true;
          })
          .map((character) => ({
            id: `char-${character.id}`,
            type: 'character',
            position: { x: character.position.x * 100, y: character.position.y * 100 },
            data: { character },
          }))
      : [];
    
    const newLocationNodes: Node[] = world?.map?.locations && Array.isArray(world.map.locations)
      ? world.map.locations
          .filter(loc => {
            if (!loc || !loc.discoveredByPlayer) return false; // Only show discovered locations
            if (!loc.position || typeof loc.position.x !== 'number' || typeof loc.position.y !== 'number') {
              console.warn('Location missing valid position:', loc.name, loc.position);
              return false;
            }
            return true;
          })
          .map((location) => ({
            id: `loc-${location.id}`,
            type: 'location',
            position: { x: location.position.x * 100, y: location.position.y * 100 },
            data: { location },
          }))
      : [];
    
    setNodes([...newCharacterNodes, ...newLocationNodes]);
  }, [characters, world, setNodes]);
  
  if (!world) {
    return (
      <div className="h-full bg-game-bg flex items-center justify-center">
        <p className="text-text-secondary">No world loaded. Create a new world to begin!</p>
      </div>
    );
  }
  
  // Safety check for map
  if (!world.map) {
    console.error('World has no map property:', world);
    return (
      <div className="h-full bg-game-bg flex items-center justify-center">
        <p className="text-text-secondary text-center">
          World data is incomplete. Please create a new world.
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-game-bg relative">
      {world.map.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: `url(${world.map.backgroundImageUrl})`,
            filter: 'sepia(20%) contrast(90%)',
          }}
        />
      )}
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ background: world.map.backgroundImageUrl ? 'transparent' : '#1a1a1a' }}
      >
        <Controls />
        <Background color="#2a2a2a" gap={16} />
        <Panel position="top-right" className="bg-panel-bg border border-panel-border rounded p-2 text-xs">
          <div className="font-semibold text-accent mb-1">{world.name}</div>
          <div className="text-text-secondary">
            Map: {world.map.width || 100} x {world.map.height || 100} units
          </div>
          <div className="text-text-secondary">
            Locations: {world.map.locations?.filter(l => l.discoveredByPlayer).length || 0} / {world.map.locations?.length || 0}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};
