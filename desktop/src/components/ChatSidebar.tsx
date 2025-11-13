import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { RAGSIcon } from './RAGSLogo';

export default function ChatSidebar() {
  const { messages, addMessage } = useStore();
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Show only last 3 messages when collapsed, all when expanded
  const visibleMessages = isExpanded ? messages : messages.slice(-3);

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

  // Always show chat - no toggle button needed

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 0.9 }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed left-4 bottom-20 z-30 bg-black/40 backdrop-blur-md border border-primary/30 rounded-2xl flex flex-col w-80 max-h-80"
    >
      {/* Header */}
      <div className="p-3 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RAGSIcon size={20} />
          <div>
            <h3 className="text-white font-semibold text-xs">RAGS Chat</h3>
            <p className="text-xs text-muted/80">Always listening</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted hover:text-primary transition-colors p-1"
        >
          <MessageSquare size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${isExpanded ? 'max-h-60' : 'max-h-32'}`}>
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-center">
            <Bot size={20} className="text-muted/60 mb-1" />
            <p className="text-white/80 font-semibold text-xs mb-1">Ready to chat</p>
            <p className="text-muted/60 text-xs">Voice or type...</p>
          </div>
        ) : (
          visibleMessages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.1,
                type: 'spring',
                damping: 20
              }}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={`
                  w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-green-400 to-emerald-400' 
                    : 'bg-gradient-to-br from-blue-400 to-purple-400'
                  }
                `}
              >
                {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className={`
                  flex-1 p-2 rounded-lg text-xs backdrop-blur-sm
                  ${msg.role === 'user' 
                    ? 'bg-green-500/20 border border-green-400/40 text-green-100' 
                    : 'bg-blue-500/20 border border-blue-400/40 text-blue-100'
                  }
                `}
              >
                <p className="text-xs leading-relaxed">{msg.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {!isExpanded && messages.length > 3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-1"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-primary/80 hover:text-primary transition-colors"
            >
              +{messages.length - 3} more messages
            </button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-primary/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type or speak..."
            className="flex-1 bg-black/30 border border-primary/20 rounded-lg px-3 py-2 text-white text-xs placeholder-muted/60 outline-none focus:border-primary/50 focus:bg-black/50 transition-all backdrop-blur-sm"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-primary/80 to-secondary/80 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
          >
            <Send size={12} className="text-white" />
          </motion.button>
        </div>
      </div>

    </motion.div>
  );
}
