import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGameStore } from '../store/gameStore';

/**
 * Custom node component for characters on the map
 */
const CharacterNode: React.FC<{ data: any }> = ({ data }) => {
  const { setSelectedCharacter } = useGameStore();
  const character = data.character;
  
  return (
    <div
      onClick={() => setSelectedCharacter(character)}
      className="cursor-pointer bg-panel-bg border-2 border-accent rounded-lg p-2 min-w-[100px] hover:bg-panel-border transition-colors"
      style={{
        borderColor: character.isInPlayerParty ? '#6366f1' : '#2a2a2a',
      }}
    >
      <div className="text-xs font-bold truncate">
        {character.discoveredByPlayer ? character.name : 'Unknown'}
      </div>
      <div className="text-xs text-text-secondary">
        {character.advancementTier}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  character: CharacterNode,
};

/**
 * Map view component with draggable, zoomable world map
 */
export const MapView: React.FC = () => {
  const { world, characters } = useGameStore();
  
  // Convert characters to React Flow nodes
  const initialNodes: Node[] = characters.map((character) => ({
    id: character.id,
    type: 'character',
    position: { x: character.position.x * 100, y: character.position.y * 100 },
    data: { character },
  }));
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Update nodes when characters change
  React.useEffect(() => {
    const newNodes: Node[] = characters.map((character) => ({
      id: character.id,
      type: 'character',
      position: { x: character.position.x * 100, y: character.position.y * 100 },
      data: { character },
    }));
    setNodes(newNodes);
  }, [characters, setNodes]);
  
  if (!world) {
    return (
      <div className="h-full bg-game-bg flex items-center justify-center">
        <p className="text-text-secondary">No world loaded</p>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-game-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background color="#2a2a2a" gap={16} />
      </ReactFlow>
    </div>
  );
};
