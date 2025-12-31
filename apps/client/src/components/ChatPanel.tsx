import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Chat interface for Game Master interaction and world building
 */
export const ChatPanel: React.FC = () => {
  const { 
    chatMessages, 
    addChatMessage, 
    clearChatMessages,
    world, 
    setWorld, 
    setCharacters,
    isWorldBuilding,
    setWorldBuilding,
  } = useGameStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const handleWorldBuilding = async (story: string) => {
    try {
      setWorldBuilding(true);
      addChatMessage('system', '🌍 Building your world... This may take a moment.');
      
      const response = await fetch('/api/worlds/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ story }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to build world');
      }
      
      const data = await response.json();
      
      // Load the world data
      setWorld(data.world);
      
      // Fetch and load characters
      const charsResponse = await fetch(`/api/worlds/${data.world.id}/characters`);
      if (charsResponse.ok) {
        const charsData = await charsResponse.json();
        setCharacters(charsData.characters);
      }
      
      setWorldBuilding(false);
      
      // Clear chat and show welcome message
      clearChatMessages();
      addChatMessage('gm', `Welcome to ${data.world.name}! Your adventure begins now.`);
      addChatMessage('gm', `${data.world.description}`);
      addChatMessage('gm', `There are ${data.characterCount} characters in this world. What would you like to do?`);
      
    } catch (error) {
      console.error('World building error:', error);
      setWorldBuilding(false, 'Failed to build world. Please try again.');
      addChatMessage('system', '❌ Failed to build world. Please check your story and try again.');
    }
  };
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // If no world exists yet, treat this as world building
    if (!world) {
      addChatMessage('player', input.substring(0, 100) + (input.length > 100 ? '...' : ''));
      setInput('');
      await handleWorldBuilding(input);
      return;
    }
    
    // Normal game interaction
    addChatMessage('player', input);
    setInput('');
    
    // TODO: Send message to backend via WebSocket for game master response
    setTimeout(() => {
      addChatMessage('gm', `[Game Master response to: "${input}"]`);
    }, 1000);
  };
  
  return (
    <div className="h-full bg-panel-bg border-t border-panel-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-panel-border">
        <h3 className="font-semibold text-accent">
          {!world ? 'World Builder' : 'Game Master'}
        </h3>
      </div>
      
      {/* Messages - Scrollable container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {chatMessages.length === 0 ? (
          <div className="text-text-secondary text-sm space-y-2">
            {!world ? (
              <>
                <p className="font-semibold text-accent">Welcome to Perpetu.AI!</p>
                <p>Paste your world story in the text box below to begin.</p>
                <p className="text-xs">Your story should include:</p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                  <li>World description and geography</li>
                  <li>Key locations</li>
                  <li>Characters with their backgrounds</li>
                  <li>Factions and conflicts</li>
                </ul>
              </>
            ) : (
              <p>The Game Master will narrate your journey here...</p>
            )}
          </div>
        ) : (
          chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'player' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg break-words ${
                  message.sender === 'player'
                    ? 'bg-accent text-white'
                    : message.sender === 'system'
                    ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-700/50'
                    : 'bg-panel-border text-text-primary'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</div>
                <div className="text-xs opacity-60 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isWorldBuilding && (
          <div className="flex justify-center">
            <div className="bg-panel-border p-4 rounded-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
              <span className="text-sm text-text-secondary">Building your world...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-panel-border">
        <div className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Allow Shift+Enter for new line, Enter alone to send
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              !world 
                ? "Paste your world story here and press Enter (or click Send)..." 
                : "Type your action or question... (Shift+Enter for new line)"
            }
            disabled={isWorldBuilding}
            className="w-full bg-panel-border text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent resize-none overflow-y-auto"
            rows={!world ? 6 : 3}
            style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isWorldBuilding}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!world ? 'Build World' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
