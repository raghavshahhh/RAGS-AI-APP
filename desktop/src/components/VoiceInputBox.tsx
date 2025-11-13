import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, Edit3 } from 'lucide-react';

interface VoiceInputBoxProps {
  isListening: boolean;
  onSend: (text: string) => void;
  onToggleVoice: () => void;
  interimTranscript?: string;
}

export default function VoiceInputBox({ isListening, onSend, onToggleVoice, interimTranscript = '' }: VoiceInputBoxProps) {
  const [inputText, setInputText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSend = () => {
    if (inputText.trim()) {
      onSend(inputText.trim());
      setInputText('');
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Update input text from voice recognition
  useEffect(() => {
    const handleVoiceInput = (event: CustomEvent) => {
      setInputText(event.detail.text);
      setIsEditing(false);
    };

    window.addEventListener('voiceInput', handleVoiceInput as EventListener);
    return () => window.removeEventListener('voiceInput', handleVoiceInput as EventListener);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-[calc(50%+200px)] left-[calc(50%-180px)] transform -translate-x-1/2 w-full max-w-sm px-3"
    >
      <div className="glass rounded-lg p-2 border border-primary/20">
        {/* Voice Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-muted">
              {isListening ? 'Listening...' : 'Voice off'}
            </span>
          </div>
          
          <button
            onClick={onToggleVoice}
            className={`p-1.5 rounded-lg transition-colors ${
              isListening ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
            }`}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={interimTranscript || inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setIsEditing(true);
              }}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Speak or type..." : "Type message..."}
              className={`w-full bg-dark/50 border border-primary/30 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:border-primary/60 transition-colors text-sm ${
                interimTranscript ? 'text-primary/70 italic' : 'text-white placeholder-muted'
              }`}
              rows={1}
              style={{ minHeight: '32px', maxHeight: '60px' }}
              readOnly={!!interimTranscript}
            />
            
            {isEditing && (
              <div className="absolute top-2 right-2">
                <Edit3 size={14} className="text-primary" />
              </div>
            )}
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}