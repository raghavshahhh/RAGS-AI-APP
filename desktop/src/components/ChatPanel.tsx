import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot } from 'lucide-react';
import { useStore } from '../store/useStore';
import { RAGSIcon } from './RAGSLogo';

interface ChatPanelProps {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { messages, addMessage } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    });

    // Connect to real backend API
    try {
      const response = await fetch('http://localhost:3000/api/real-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) {
        throw new Error('Backend not available');
      }

      const data = await response.json();
      
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response.text,
        timestamp: new Date(),
      });
    } catch (error) {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please make sure the backend is running.',
        timestamp: new Date(),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="glass h-full w-full max-w-md flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RAGSIcon size={40} />
            <div>
              <h2 className="text-white font-semibold">RAGS AI</h2>
              <p className="text-xs text-muted">Always here to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot size={48} className="text-muted mb-4" />
              <p className="text-white font-semibold mb-2">Start a conversation</p>
              <p className="text-muted text-sm">Ask me anything!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-br from-primary to-secondary'
                  }
                `}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`
                  flex-1 p-3 rounded-2xl
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                    : 'bg-surface/50 border border-primary/10'
                  }
                `}>
                  <p className="text-white text-sm">{msg.content}</p>
                  <p className="text-xs text-muted mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-primary/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-surface/50 border border-primary/10 rounded-xl px-4 py-3 text-white placeholder-muted outline-none focus:border-primary/30 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-primary to-secondary p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

