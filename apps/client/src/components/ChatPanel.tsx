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
    addCharacter,
    characters,
    isWorldBuilding,
    setWorldBuilding,
  } = useGameStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsPlayerCharacter, setNeedsPlayerCharacter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Check if player character exists when world is loaded and load chat history
  useEffect(() => {
    if (world) {
      checkPlayerCharacter();
      loadChatHistory();
    }
  }, [world]);
  
  const loadChatHistory = async () => {
    if (!world?.id) return;
    
    try {
      const response = await fetch(`/api/worlds/${world.id}/chat`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages && Array.isArray(data.messages)) {
          // Clear existing messages and load from storage
          clearChatMessages();
          data.messages.forEach((msg: any) => {
            addChatMessage(msg.sender, msg.content);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };
  
  const checkPlayerCharacter = async () => {
    if (!world) return;
    
    try {
      const response = await fetch(`/api/gm/player-character/${world.id}`);
      if (response.status === 404) {
        // No player character exists
        setNeedsPlayerCharacter(true);
        addChatMessage('system', '👤 First, let\'s create your character! Describe your character including:');
        addChatMessage('system', '• Name\n• Advancement tier (Foundation to Monarch)\n• Madra nature (Pure, Fire, Water, etc.)\n• Background and starting point');
      } else if (response.ok) {
        const data = await response.json();
        setNeedsPlayerCharacter(false);
        // Ensure player character is in the characters list
        const hasPlayer = characters.some(c => c.isPlayerCharacter);
        if (!hasPlayer && data.character) {
          addCharacter(data.character);
        }
      }
    } catch (error) {
      console.error('Error checking player character:', error);
    }
  };
  
  const handlePlayerCharacterCreation = async (description: string) => {
    try {
      setIsProcessing(true);
      addChatMessage('system', '✨ Creating your character... This may take a moment.');
      
      const response = await fetch('/api/gm/player-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          worldId: world?.id,
          description 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create player character');
      }
      
      const data = await response.json();
      
      // Add player character to the store
      addCharacter(data.character);
      
      setNeedsPlayerCharacter(false);
      setIsProcessing(false);
      
      addChatMessage('gm', `Welcome, ${data.character.name}! You are now in ${world?.name}.`);
      addChatMessage('gm', `You stand at ${data.character.position.x}, ${data.character.position.y} on the map. What would you like to do?`);
      
    } catch (error) {
      console.error('Player character creation error:', error);
      setIsProcessing(false);
      addChatMessage('system', '❌ Failed to create character. Please try again with a clear description.');
    }
  };
  
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
    
    // If we need player character, create it
    if (needsPlayerCharacter) {
      addChatMessage('player', input);
      setInput('');
      await handlePlayerCharacterCreation(input);
      return;
    }
    
    // Normal game interaction with Game Master
    addChatMessage('player', input);
    const messageToSend = input;
    setInput('');
    
    try {
      setIsProcessing(true);
      
      // Send message to Game Master
      const response = await fetch('/api/gm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          worldId: world.id,
          message: messageToSend,
          chatHistory: chatMessages.slice(-10).map(m => ({
            sender: m.sender,
            content: m.content
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get GM response');
      }
      
      const data = await response.json();
      
      // Update characters if state changes occurred
      if (data.updatedCharacters && Array.isArray(data.updatedCharacters)) {
        console.log(`Received ${data.updatedCharacters.length} updated character(s) from GM`);
        
        // Update each character in the store
        data.updatedCharacters.forEach((updatedChar: any) => {
          // Find and replace the character in the store
          const currentChars = characters.slice();
          const index = currentChars.findIndex(c => c.id === updatedChar.id);
          if (index !== -1) {
            currentChars[index] = updatedChar;
            console.log(`Updated character: ${updatedChar.name}`);
          }
          // Replace all characters to trigger re-render
          setCharacters(currentChars);
        });
      }
      
      setIsProcessing(false);
      addChatMessage('gm', data.response);
      
    } catch (error) {
      console.error('Game Master error:', error);
      setIsProcessing(false);
      addChatMessage('system', '❌ Failed to get Game Master response. Please try again.');
    }
  };
  
  // Split messages into GM responses and player messages
  const gmMessages = chatMessages.filter(m => m.sender === 'gm' || m.sender === 'system');
  const playerMessages = chatMessages.filter(m => m.sender === 'player');
  
  return (
    <div className="h-full bg-panel-bg border-t border-panel-border flex overflow-hidden">
      {/* Left Half - GM Responses */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-panel-border">
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-panel-border">
          <h3 className="font-semibold text-accent">
            {!world ? 'World Builder' : needsPlayerCharacter ? 'Character Creation' : 'Game Master'}
          </h3>
        </div>
        
        {/* GM Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {gmMessages.length === 0 ? (
            <div className="text-text-secondary text-sm space-y-2">
              {!world ? (
                <>
                  <p className="font-semibold text-accent">Welcome to Perpetu.AI!</p>
                  <p>Paste your world story in the right panel to begin.</p>
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
            gmMessages.map((message) => (
              <div key={message.id} className="flex justify-start">
                <div className={`max-w-[90%] p-3 rounded-lg break-words ${
                  message.sender === 'system'
                    ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-700/50'
                    : 'bg-panel-border text-text-primary'
                }`}>
                  <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {message.content}
                  </div>
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
          {isProcessing && (
            <div className="flex justify-center">
              <div className="bg-panel-border p-4 rounded-lg flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                <span className="text-sm text-text-secondary">Game Master is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Half - Player Input & History */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-panel-border">
          <h3 className="font-semibold text-accent">Your Actions</h3>
        </div>
        
        {/* Player Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {playerMessages.length === 0 ? (
            <div className="text-text-secondary text-sm">
              <p>Your messages will appear here...</p>
            </div>
          ) : (
            playerMessages.map((message) => (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[90%] p-3 rounded-lg break-words bg-accent text-white">
                  <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {message.content}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input - Horizontal layout */}
        <div className="flex-shrink-0 p-3 border-t border-panel-border">
          <div className="flex gap-2">
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
                  ? "Paste your world story here..." 
                  : needsPlayerCharacter
                  ? "Describe your character..."
                  : "Type your action..."
              }
              disabled={isWorldBuilding || isProcessing}
              className="flex-1 bg-panel-border text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent resize-none overflow-y-auto"
              rows={2}
              style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isWorldBuilding || isProcessing}
              className="px-6 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {!world ? 'Build' : needsPlayerCharacter ? 'Create' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
