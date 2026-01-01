import React, { useState, useCallback } from 'react';
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

// Map configuration constants
const DEFAULT_MAP_SIZE = 100; // Default map dimensions in units
const COORDINATE_SCALE_FACTOR = 100; // Scale factor for converting game coordinates to display pixels
const MAP_IMAGE_OPACITY = 0.4; // Background image opacity
const MAP_IMAGE_FILTER = 'sepia(20%) contrast(90%)'; // Filter applied to background image

/**
 * Custom node component for grouped characters on the map
 */
const CharacterGroupNode: React.FC<{ data: any }> = ({ data }) => {
  const { setSelectedCharacter } = useGameStore();
  const characters = data.characters || [];
  const [showList, setShowList] = useState(false);
  
  return (
    <div className="relative">
      {/* Group count badge */}
      <div className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10 shadow-lg">
        {characters.length}
      </div>
      
      {/* Group pin */}
      <div
        onClick={() => setShowList(!showList)}
        className="cursor-pointer bg-panel-bg border-2 border-accent rounded-lg p-2 min-w-[100px] hover:bg-panel-border transition-colors shadow-lg"
      >
        <div className="text-xs font-bold">👥 Group</div>
        <div className="text-xs text-text-secondary">
          {characters.length} characters
        </div>
      </div>
      
      {/* Character list dropdown */}
      {showList && (
        <div className="absolute top-full left-0 mt-2 bg-panel-bg border-2 border-panel-border rounded-lg shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
          {characters.map((char: any) => (
            <div
              key={char.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCharacter(char);
                setShowList(false);
              }}
              className="p-2 hover:bg-panel-border cursor-pointer flex items-center gap-2 border-b border-panel-border last:border-b-0"
            >
              {char.avatarUrl && (
                <img
                  src={char.avatarUrl}
                  alt={char.name || 'Unknown'}
                  className="w-8 h-8 rounded-full object-cover border border-accent"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{char.name || 'Unknown'}</div>
                <div className="text-xs text-text-secondary truncate">{char.advancementTier || 'Unknown'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
      onClick={() => {
        setSelectedLocation(location);
        console.log(location)
      }}
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

/**
 * Custom node component for dropped markers on the map
 */
const MarkerNode: React.FC<{ data: any }> = ({ data }) => {
  const { setSelectedCharacter, setSelectedLocation, characters, world } = useGameStore();
  const { type, entityId, name } = data;
  
  const handleClick = () => {
    if (type === 'character') {
      const char = characters.find(c => c.id === entityId);
      if (char) {
        setSelectedCharacter(char);
        setSelectedLocation(null);
      }
    } else if (type === 'location') {
      const loc = world?.map?.locations?.find(l => l.id === entityId);
      if (loc) {
        console.log(loc)
        setSelectedLocation(loc);
        setSelectedCharacter(null);
      }
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-accent text-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
      title={name}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  );
};

/**
 * Modal for adding map markers
 */
interface AddMarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMarker: (type: 'npc' | 'location', entityId: string, name: string) => void;
  characters: any[];
  locations: Location[];
  existingMarkers: Set<string>;
}

const AddMarkerModal: React.FC<AddMarkerModalProps> = ({
  isOpen,
  onClose,
  onAddMarker,
  characters,
  locations,
  existingMarkers,
}) => {
  const [selectedType, setSelectedType] = useState<'npc' | 'location' | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedType && selectedEntity) {
      const entity = selectedType === 'npc' 
        ? characters.find(c => c.id === selectedEntity)
        : locations.find(l => l.id === selectedEntity);
      
      if (entity) {
        onAddMarker(selectedType, selectedEntity, entity.name);
        setSelectedType(null);
        setSelectedEntity(null);
        onClose();
      }
    }
  };

  const availableNPCs = characters.filter(c => !existingMarkers.has(c.id));
  const availableLocations = locations.filter(l => !existingMarkers.has(l.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-bg border-2 border-panel-border rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-accent">Add Map Marker</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-accent transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {!selectedType ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary mb-4">Select marker type:</p>
            <button
              onClick={() => setSelectedType('npc')}
              disabled={availableNPCs.length === 0}
              className="w-full py-3 px-4 bg-panel-border text-white rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              NPC ({availableNPCs.length} available)
            </button>
            <button
              onClick={() => setSelectedType('location')}
              disabled={availableLocations.length === 0}
              className="w-full py-3 px-4 bg-panel-border text-white rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Location ({availableLocations.length} available)
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => {
                setSelectedType(null);
                setSelectedEntity(null);
              }}
              className="text-sm text-accent hover:underline mb-2"
            >
              ← Back to type selection
            </button>
            <p className="text-sm text-text-secondary mb-2">
              Select {selectedType === 'npc' ? 'NPC' : 'Location'}:
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedType === 'npc' ? (
                availableNPCs.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedEntity(char.id)}
                    className={`w-full p-3 rounded text-left transition-colors ${
                      selectedEntity === char.id
                        ? 'bg-accent text-white'
                        : 'bg-panel-border hover:bg-opacity-70'
                    }`}
                  >
                    <div className="font-semibold">{char.name}</div>
                    <div className="text-xs text-text-secondary">
                      {char.advancementTier || 'Unknown'} - {char.description?.substring(0, 50) || 'No description'}
                    </div>
                  </button>
                ))
              ) : (
                availableLocations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedEntity(loc.id)}
                    className={`w-full p-3 rounded text-left transition-colors ${
                      selectedEntity === loc.id
                        ? 'bg-accent text-white'
                        : 'bg-panel-border hover:bg-opacity-70'
                    }`}
                  >
                    <div className="font-semibold">{loc.name}</div>
                    <div className="text-xs text-text-secondary capitalize">
                      {loc.type} - {loc.description?.substring(0, 50) || 'No description'}
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selectedEntity}
              className="w-full py-2 px-4 bg-accent text-white rounded hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              Add Marker
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Background image node data type
 */
interface BackgroundImageData {
  imageUrl: string;
  width: number;
  height: number;
}

/**
 * Custom node component for background map image
 */
const BackgroundImageNode: React.FC<{ data: BackgroundImageData }> = ({ data }) => {
  const { imageUrl, width, height } = data;
  
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        opacity: MAP_IMAGE_OPACITY,
        filter: MAP_IMAGE_FILTER,
        pointerEvents: 'none',
      }}
    />
  );
};

const nodeTypes: NodeTypes = {
  character: CharacterNode,
  characterGroup: CharacterGroupNode,
  location: LocationNode,
  marker: MarkerNode,
  backgroundImage: BackgroundImageNode,
};

/**
 * Map view component with draggable, zoomable world map
 */
export const MapView: React.FC = () => {
  const { world, characters, updateCharacter } = useGameStore();
  const [markers, setMarkers] = useState<Array<{
    id: string;
    type: 'character' | 'location';
    entityId: string;
    name: string;
    position: { x: number; y: number };
  }>>([]);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [showAddMarkerModal, setShowAddMarkerModal] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // Debug logging
  React.useEffect(() => {
    console.log('MapView - World:', world);
    console.log('MapView - Characters:', characters);
  }, [world, characters]);
  
  /**
   * Group characters by proximity (within 3 units considered same position)
   */
  const groupCharactersByPosition = (chars: any[]): Map<string, any[]> => {
    const GROUPING_DISTANCE = 3;
    const groups = new Map<string, any[]>();
    
    chars.forEach(char => {
      if (!char?.position) return;
      
      // Find existing group within grouping distance
      let foundGroup = false;
      for (const [key, group] of groups.entries()) {
        const [x, y] = key.split(',').map(Number);
        const distance = calculateDistance(char.position.x, char.position.y, x, y);
        
        if (distance <= GROUPING_DISTANCE) {
          group.push(char);
          foundGroup = true;
          break;
        }
      }
      
      // Create new group if none found nearby
      if (!foundGroup) {
        const key = `${char.position.x.toFixed(1)},${char.position.y.toFixed(1)}`;
        groups.set(key, [char]);
      }
    });
    
    return groups;
  };
  
  /**
   * Find characters at a specific location (within 3 units)
   */
  const getCharactersAtLocation = (location: any, allChars: any[]): any[] => {
    const LOCATION_RADIUS = 3;
    
    return allChars.filter(char => {
      if (!char?.position || !location?.position) return false;
      const distance = calculateDistance(
        char.position.x,
        char.position.y,
        location.position.x,
        location.position.y
      );
      return distance <= LOCATION_RADIUS;
    });
  };
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [, , onEdgesChange] = useEdgesState([]);
  
  // Handle when a marker node is dragged - update the object's coordinates in real-time
  const handleNodeDragStop = useCallback((_event: any, node: Node) => {
    // Check if this is a marker node
    if (node.id.startsWith('marker-')) {
      const marker = markers.find(m => `marker-${m.id}` === node.id);
      if (marker) {
        console.log(`[MapView] Marker ${marker.name} moved to:`, node.position);
        
        // Update the marker position in state
        const updatedMarkers = markers.map(m => 
          m.id === marker.id 
            ? { ...m, position: { x: node.position.x, y: node.position.y } }
            : m
        );
        setMarkers(updatedMarkers);
        
        // Update the actual entity coordinates in real-time
        if (marker.type === 'character') {
          const newPosition = {
            x: node.position.x / COORDINATE_SCALE_FACTOR, // Convert back from display coordinates
            y: node.position.y / COORDINATE_SCALE_FACTOR,
          };
          console.log(`[MapView] Updating character ${marker.entityId} position to:`, newPosition);
          updateCharacter(marker.entityId, { position: newPosition });
          
          // TODO: Send update to backend
        } else if (marker.type === 'location' && world) {
          // Update location in world
          const newPosition = {
            x: node.position.x / COORDINATE_SCALE_FACTOR,
            y: node.position.y / COORDINATE_SCALE_FACTOR,
          };
          console.log(`[MapView] Updating location ${marker.entityId} position to:`, newPosition);
          
          // TODO: Update location coordinates in backend
          // For now, just log the update
        }
      }
    }
  }, [markers, updateCharacter, world]);
  
  // Update nodes when characters or locations change
  React.useEffect(() => {
    if (!world || !Array.isArray(characters)) {
      setNodes([]);
      return;
    }
    
    // Step 0: Create background image node if available (positioned at origin, behind everything)
    const backgroundNodes: Node[] = [];
    if (world.map.backgroundImageUrl) {
      // Use map dimensions or default to a large size
      const mapWidth = (world.map.width || DEFAULT_MAP_SIZE) * COORDINATE_SCALE_FACTOR;
      const mapHeight = (world.map.height || DEFAULT_MAP_SIZE) * COORDINATE_SCALE_FACTOR;
      
      backgroundNodes.push({
        id: 'background-image',
        type: 'backgroundImage',
        position: { x: 0, y: 0 },
        data: { 
          imageUrl: world.map.backgroundImageUrl,
          width: mapWidth,
          height: mapHeight,
        },
        draggable: false,
        selectable: false,
        zIndex: -1,
      });
    }
    
    // Get valid locations
    const validLocations = world?.map?.locations && Array.isArray(world.map.locations)
      ? world.map.locations.filter(loc => {
          if (!loc || !loc.discoveredByPlayer) return false;
          if (!loc.position || typeof loc.position.x !== 'number' || typeof loc.position.y !== 'number') {
            console.warn('Location missing valid position:', loc?.name, loc?.position);
            return false;
          }
          return true;
        })
      : [];
    
    // Get valid characters with positions
    const validCharacters = characters.filter(char => {
      if (!char || !char.position || typeof char.position.x !== 'number' || typeof char.position.y !== 'number') {
        if (char) {
          console.warn('Character missing valid position:', char.name, char.position);
        }
        return false;
      }
      return true;
    });
    
    // Step 1: Create location nodes
    const locationNodes: Node[] = validLocations.map((location) => ({
      id: `loc-${location.id}`,
      type: 'location',
      position: { x: location.position.x * COORDINATE_SCALE_FACTOR, y: location.position.y * COORDINATE_SCALE_FACTOR },
      data: { location },
    }));
    
    // Step 2: Find characters at locations (these won't get separate pins)
    const charactersAtLocations = new Set<string>();
    validLocations.forEach(loc => {
      const charsHere = getCharactersAtLocation(loc, validCharacters);
      charsHere.forEach(char => charactersAtLocations.add(char.id));
    });
    
    // Step 3: Group remaining characters by position
    const ungroupedCharacters = validCharacters.filter(
      char => !charactersAtLocations.has(char.id)
    );
    const characterGroups = groupCharactersByPosition(ungroupedCharacters);
    
    // Step 4: Create character/group nodes
    const characterNodes: Node[] = Array.from(characterGroups.entries()).map(([key, chars]) => {
      if (chars.length === 1) {
        // Solo character node
        const char = chars[0];
        return {
          id: `char-${char.id}`,
          type: 'character',
          position: { x: char.position.x * COORDINATE_SCALE_FACTOR, y: char.position.y * COORDINATE_SCALE_FACTOR },
          data: { character: char },
        };
      } else {
        // Group node
        const [x, y] = key.split(',').map(Number);
        return {
          id: `group-${key}`,
          type: 'characterGroup',
          position: { x: x * COORDINATE_SCALE_FACTOR, y: y * COORDINATE_SCALE_FACTOR },
          data: { characters: chars },
        };
      }
    });
    
    // Step 5: Create marker nodes
    const markerNodes: Node[] = markers.map(marker => ({
      id: `marker-${marker.id}`,
      type: 'marker',
      position: { x: marker.position.x, y: marker.position.y },
      data: { type: marker.type, entityId: marker.entityId, name: marker.name },
      draggable: true,
    }));
    
    setNodes([...backgroundNodes, ...locationNodes, ...characterNodes, ...markerNodes]);
  }, [characters, world, markers, setNodes]);
  
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
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { type, id, name } = data;
      
      // Get the ReactFlow bounds
      const reactFlowBounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - reactFlowBounds.left;
      const y = e.clientY - reactFlowBounds.top;
      
      // Check if marker already exists for this entity
      const existingMarkerIndex = markers.findIndex(m => m.entityId === id);
      
      if (existingMarkerIndex >= 0) {
        // Update existing marker position
        const updatedMarkers = [...markers];
        updatedMarkers[existingMarkerIndex] = {
          ...updatedMarkers[existingMarkerIndex],
          position: { x, y },
        };
        setMarkers(updatedMarkers);
      } else {
        // Create new marker (max 1 per entity)
        const newMarker = {
          id: `${type}-${id}-${Date.now()}`,
          type,
          entityId: id,
          name,
          position: { x, y },
        };
        setMarkers([...markers, newMarker]);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  // Handle adding a marker from the modal
  const handleAddMarker = useCallback((type: 'npc' | 'location', entityId: string, name: string) => {
    // Check if marker already exists
    if (markers.some(m => m.entityId === entityId)) {
      console.warn('Marker already exists for this entity');
      return;
    }
    
    // Get center of viewport if reactFlowInstance is available
    let centerX = 500; // Default fallback
    let centerY = 500;
    
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      const bounds = document.querySelector('.react-flow')?.getBoundingClientRect();
      if (bounds) {
        // Calculate center in flow coordinates
        centerX = (bounds.width / 2 - viewport.x) / viewport.zoom;
        centerY = (bounds.height / 2 - viewport.y) / viewport.zoom;
      }
    }
    
    // Create marker at center
    const newMarker = {
      id: `${type}-${entityId}-${Date.now()}`,
      type: type === 'npc' ? 'character' as const : 'location' as const,
      entityId,
      name,
      position: { x: centerX, y: centerY },
    };
    
    setMarkers([...markers, newMarker]);
  }, [markers, reactFlowInstance]);
  
  // Get set of entity IDs that already have markers
  const existingMarkerIds = new Set(markers.map(m => m.entityId));
  
  return (
    <div 
      className="h-full bg-game-bg relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={(e) => {
        const reactFlowBounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - reactFlowBounds.left) / COORDINATE_SCALE_FACTOR).toFixed(1);
        const y = ((e.clientY - reactFlowBounds.top) / COORDINATE_SCALE_FACTOR).toFixed(1);
        setMouseCoords({ x: parseFloat(x), y: parseFloat(y) });
      }}
      onMouseLeave={() => setMouseCoords(null)}
    >
      {/* Mouse Coordinates Tooltip */}
      {mouseCoords && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm font-mono z-50 pointer-events-none">
          ({mouseCoords.x}, {mouseCoords.y})
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ background: '#1a1a1a' }}
        panOnScroll={true}
        preventScrolling={false}
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
      
      {/* Add Marker Button - Fixed bottom right */}
      <button
        onClick={() => setShowAddMarkerModal(true)}
        className="fixed bottom-6 right-6 bg-accent text-white rounded-full p-4 shadow-lg hover:bg-accent-dark transition-colors z-40"
        title="Add Map Marker"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      {/* Add Marker Modal */}
      <AddMarkerModal
        isOpen={showAddMarkerModal}
        onClose={() => setShowAddMarkerModal(false)}
        onAddMarker={handleAddMarker}
        characters={characters}
        locations={world?.map?.locations || []}
        existingMarkers={existingMarkerIds}
      />
    </div>
  );
};
