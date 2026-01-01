import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Panel,
  useStore,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGameStore } from '../store/gameStore';

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
const BACKGROUND_Z_INDEX = -1; // Z-index for background image node

/**
 * Custom hook to get inverse zoom transform style for fixed-size nodes
 */
function useZoomTransform() {
  const zoom = useStore((state) => state.transform[2]);
  return React.useMemo(
    () => ({ transform: `scale(${1 / zoom})`, transformOrigin: 'center' }),
    [zoom]
  );
}

/**
 * Custom node component for grouped characters on the map
 */
const CharacterGroupNode: React.FC<{ data: any }> = ({ data }) => {
  const { setSelectedCharacter } = useGameStore();
  const characters = data.characters || [];
  const [showList, setShowList] = useState(false);
  const zoomTransform = useZoomTransform();
  
  return (
    <div className="relative" style={zoomTransform}>
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
 * Custom node component for dropped markers on the map
 * This is now the universal marker type for all entities (locations and characters)
 */
const MarkerNode: React.FC<{ data: any }> = ({ data }) => {
  const { type, entityId, name } = data;
  const { characters, world } = useGameStore();
  const zoomTransform = useZoomTransform();
  
  // Get the entity to show its image
  const entity = type === 'character' 
    ? characters.find(c => c.id === entityId)
    : world?.map?.locations?.find(l => l.id === entityId);
  
  const avatarUrl = type === 'character' ? (entity as any)?.avatarUrl : null;
  
  return (
    <div
      className="cursor-pointer relative flex flex-col items-center"
      style={zoomTransform}
    >
      {/* Unified element: image/icon, name, and marker pin */}
      <div className="flex flex-col items-center">
        {/* Image or icon with pin background */}
        <div className="relative">
          {avatarUrl ? (
            <img 
              src={avatarUrl}
              alt={name}
              className="w-10 h-10 rounded-full border-2 border-accent object-cover shadow-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border-2 border-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Name label directly below */}
        <div className="bg-accent text-white border border-white rounded px-2 py-1 shadow-md hover:bg-opacity-90 transition-colors mt-1">
          <div className="text-xs font-bold text-center whitespace-nowrap">{name}</div>
        </div>
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
  characterGroup: CharacterGroupNode,
  marker: MarkerNode,
  backgroundImage: BackgroundImageNode,
};

/**
 * Inner map view component with ReactFlow context access
 */
const MapViewInner: React.FC = () => {
  const { world, characters, updateCharacter, updateLocation, setSelectedCharacter, setSelectedLocation } = useGameStore();
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  
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
  
  // Handle node clicks to select entities
  const handleNodeClick = useCallback((_event: any, node: Node) => {
    console.log('[MapView] Node clicked:', node);
    
    // All location and character nodes now use 'marker' type with entityId in data
    if (node.type === 'marker') {
      const { type, entityId } = node.data as any;
      
      if (type === 'character') {
        const char = characters.find(c => c.id === entityId);
        if (char) {
          setSelectedCharacter(char);
          setSelectedLocation(null);
          console.log('[MapView] Selected character:', char);
        }
      } else if (type === 'location') {
        const loc = world?.map?.locations?.find(l => l.id === entityId);
        if (loc) {
          setSelectedLocation(loc);
          setSelectedCharacter(null);
          console.log('[MapView] Selected location:', loc);
        }
      }
    }
    
    // Handle character group node clicks (still separate type for dropdown functionality)
    if (node.type === 'characterGroup') {
      const characters = (node.data as any)?.characters;
      if (characters && characters.length > 0) {
        // For group nodes, select the first character
        setSelectedCharacter(characters[0]);
        setSelectedLocation(null);
        console.log('[MapView] Selected character from group:', characters[0]);
      }
    }
  }, [setSelectedLocation, setSelectedCharacter, characters, world]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [, , onEdgesChange] = useEdgesState([]);
  
  // Handle when a node is being dragged - update coordinates in real-time
  const handleNodeDrag = useCallback((_event: any, node: Node) => {
    // All draggable nodes are now marker type with entityId
    if (node.type === 'marker') {
      const { type, entityId } = node.data as any;
      if (type && entityId) {
        // Convert display coordinates back to game coordinates
        const newPosition = {
          x: node.position.x / COORDINATE_SCALE_FACTOR,
          y: node.position.y / COORDINATE_SCALE_FACTOR,
        };
        
        if (type === 'character') {
          updateCharacter(entityId, { position: newPosition });
        } else if (type === 'location') {
          updateLocation(entityId, { position: newPosition });
        }
        
        // Update mouse coordinates display during drag
        setMouseCoords({ 
          x: parseFloat(newPosition.x.toFixed(1)), 
          y: parseFloat(newPosition.y.toFixed(1)) 
        });
      }
    }
  }, [updateCharacter, updateLocation]);
  
  // Handle when a node drag is complete
  const handleNodeDragStop = useCallback((_event: any, node: Node) => {
    if (node.type === 'marker') {
      const { type, entityId, name } = node.data as any;
      console.log(`[MapView] Marker ${name} drag complete at:`, node.position);
      
      const finalPosition = {
        x: node.position.x / COORDINATE_SCALE_FACTOR,
        y: node.position.y / COORDINATE_SCALE_FACTOR,
      };
      console.log(`[MapView] Final position for ${type} ${entityId}:`, finalPosition);
      
      // TODO: Send update to backend
    }
  }, []);
  
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
        zIndex: BACKGROUND_Z_INDEX,
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
    
    // Step 1: Create marker nodes for all locations (not just custom ones)
    const locationMarkerNodes: Node[] = validLocations.map((location) => ({
      id: `loc-${location.id}`,
      type: 'marker',
      position: { x: location.position.x * COORDINATE_SCALE_FACTOR, y: location.position.y * COORDINATE_SCALE_FACTOR },
      data: { 
        type: 'location' as const,
        entityId: location.id,
        name: location.name || 'Unknown Location',
      },
      draggable: true,
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
    
    // Step 4: Create marker nodes for characters (not groups - groups still use characterGroup type)
    const characterMarkerNodes: Node[] = [];
    const characterGroupNodes: Node[] = [];
    
    Array.from(characterGroups.entries()).forEach(([key, chars]) => {
      if (chars.length === 1) {
        // Solo character - use marker node
        const char = chars[0];
        characterMarkerNodes.push({
          id: `char-${char.id}`,
          type: 'marker',
          position: { x: char.position.x * COORDINATE_SCALE_FACTOR, y: char.position.y * COORDINATE_SCALE_FACTOR },
          data: { 
            type: 'character' as const,
            entityId: char.id,
            name: char.name || 'Unknown',
          },
          draggable: true,
        });
      } else {
        // Group node - keep as characterGroup for dropdown functionality
        const [x, y] = key.split(',').map(Number);
        characterGroupNodes.push({
          id: `group-${key}`,
          type: 'characterGroup',
          position: { x: x * COORDINATE_SCALE_FACTOR, y: y * COORDINATE_SCALE_FACTOR },
          data: { characters: chars },
          draggable: false,
        });
      }
    });
    
    setNodes([...backgroundNodes, ...locationMarkerNodes, ...characterMarkerNodes, ...characterGroupNodes]);
  }, [characters, world, setNodes]);
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Handle drop from side panel
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { type, id, name } = data;
      
      // Convert screen position to flow position (accounts for pan/zoom)
      const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      
      // Convert flow position to game coordinates
      const gameX = flowPosition.x / COORDINATE_SCALE_FACTOR;
      const gameY = flowPosition.y / COORDINATE_SCALE_FACTOR;
      
      // Update the entity's position based on type
      if (type === 'character') {
        const char = characters.find(c => c.id === id);
        if (char) {
          updateCharacter(id, { position: { x: gameX, y: gameY } });
          console.log(`[MapView] Dropped character ${name} at (${gameX.toFixed(1)}, ${gameY.toFixed(1)})`);
        }
      } else if (type === 'location') {
        const loc = world?.map?.locations?.find(l => l.id === id);
        if (loc) {
          updateLocation(id, { position: { x: gameX, y: gameY } });
          console.log(`[MapView] Dropped location ${name} at (${gameX.toFixed(1)}, ${gameY.toFixed(1)})`);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
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
    <div 
      className="h-full bg-game-bg relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={(e) => {
        // Convert screen position to flow position (accounts for pan/zoom)
        const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        // Convert flow position to game coordinates
        const gameX = (flowPosition.x / COORDINATE_SCALE_FACTOR).toFixed(1);
        const gameY = (flowPosition.y / COORDINATE_SCALE_FACTOR).toFixed(1);
        setMouseCoords({ x: parseFloat(gameX), y: parseFloat(gameY) });
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
        onNodeClick={handleNodeClick}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ background: '#1a1a1a' }}
        minZoom={0.1}
        maxZoom={2}
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

/**
 * Map view component wrapper with ReactFlowProvider
 */
export const MapView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <MapViewInner />
    </ReactFlowProvider>
  );
};
