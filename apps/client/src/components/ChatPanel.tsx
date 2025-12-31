import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Chat interface for Game Master interaction
 */
export const ChatPanel: React.FC = () => {
  const { chatMessages, addChatMessage } = useGameStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    addChatMessage('player', input);
    setInput('');
    
    // TODO: Send message to backend via WebSocket
    // Simulate GM response for now
    setTimeout(() => {
      addChatMessage('gm', `[Game Master response to: "${input}"]`);
    }, 1000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="h-full bg-panel-bg border-t border-panel-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-panel-border">
        <h3 className="font-semibold text-accent">Game Master</h3>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <p className="text-text-secondary text-sm">
            The Game Master will narrate your journey here...
          </p>
        ) : (
          chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'player' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'player'
                    ? 'bg-accent text-white'
                    : 'bg-panel-border text-text-primary'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-60 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-panel-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your action or question..."
            className="flex-1 bg-panel-border text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
