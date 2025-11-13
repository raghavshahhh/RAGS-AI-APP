import { motion } from 'framer-motion';
import { Cpu, Database } from 'lucide-react';

export default function StatusBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="absolute bottom-4 left-4 glass px-4 py-2 rounded-xl flex items-center gap-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-muted">Online</span>
      </div>
      
      <div className="w-px h-4 bg-muted/30" />
      
      <div className="flex items-center gap-2">
        <Cpu size={14} className="text-primary" />
        <span className="text-xs text-muted">Ollama</span>
      </div>
      
      <div className="w-px h-4 bg-muted/30" />
      
      <div className="flex items-center gap-2">
        <Database size={14} className="text-secondary" />
        <span className="text-xs text-muted">Connected</span>
      </div>
    </motion.div>
  );
}

