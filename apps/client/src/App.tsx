import { useEffect } from 'react';
import { SidebarPanel } from './components/SidebarPanel';
import { MapView } from './components/MapView';
import { ChatPanel } from './components/ChatPanel';
import { InfoPanel } from './components/InfoPanel';
import { WorldSelector } from './components/WorldSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useGameStore } from './store/gameStore';

/**
 * Main application component with HUD layout
 */
function App() {
  const { connected, setConnected } = useGameStore();
  
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
          <WorldSelector />
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
        {/* Left Panel - Sidebar with tabs and info */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          {/*  Tabs (Party/NPCs/Locations) */}
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <SidebarPanel/>
            </ErrorBoundary>
          </div>
          
        </div>
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          {/*  Info Panel */}
          <div className="flex-1 overflow-hidden border-t-2 border-panel-border">
            <ErrorBoundary>
              <InfoPanel/>
            </ErrorBoundary>
          </div>
        </div>
        {/* Center Panel - Map & Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map (top 50%) */}
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <MapView/>
            </ErrorBoundary>
          </div>

          {/* Chat (bottom 50%) */}
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <ChatPanel/>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
