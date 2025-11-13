import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface SystemOverlayProps {
  isListening: boolean;
}

export default function SystemOverlay({ isListening }: SystemOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-[9999] pointer-events-none"
    >
      <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <span className="text-white text-sm font-medium">RAGS</span>
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Mic className="text-green-400" size={16} />
          </motion.div>
        ) : (
          <MicOff className="text-gray-400" size={16} />
        )}
      </div>
    </motion.div>
  );
}
