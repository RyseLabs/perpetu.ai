import { useEffect } from 'react';
import { PartyPanel } from './components/PartyPanel';
import { MapView } from './components/MapView';
import { ChatPanel } from './components/ChatPanel';
import { InfoPanel } from './components/InfoPanel';
import { useGameStore } from './store/gameStore';

/**
 * Main application component with HUD layout
 */
function App() {
  const { world, connected, setConnected } = useGameStore();
  
  useEffect(() => {
    // TODO: Initialize WebSocket connection
    // For now, just mark as connected
    setConnected(true);
  }, [setConnected]);
  
  return (
    <div className="h-screen w-screen bg-game-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-panel-bg border-b border-panel-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-accent">Perpetu.AI</h1>
          <div className="text-sm text-text-secondary">
            {world ? world.name : 'No world loaded'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-text-secondary">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Party */}
        <div className="w-64 flex-shrink-0">
          <PartyPanel />
        </div>
        
        {/* Center Panel - Map & Chat */}
        <div className="flex-1 flex flex-col">
          {/* Map (top 60%) */}
          <div className="flex-[6]">
            <MapView />
          </div>
          
          {/* Chat (bottom 40%) */}
          <div className="flex-[4]">
            <ChatPanel />
          </div>
        </div>
        
        {/* Right Panel - Character Info */}
        <div className="w-80 flex-shrink-0">
          <InfoPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
