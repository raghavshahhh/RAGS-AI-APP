import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface CommandPaletteProps {
  onClose: () => void;
  onCommand: (command: string) => void;
}

const commands = [
  { id: 1, name: 'Voice को चालू करें', action: 'start-voice', shortcut: '⌘ Space' },
  { id: 2, name: 'Chat खोलें', action: 'open-chat', shortcut: '⌘ C' },
  { id: 3, name: 'Automation बनाएं', action: 'open-automate', shortcut: '⌘ A' },
  { id: 4, name: 'Schedule देखें', action: 'open-schedule', shortcut: '⌘ S' },
  { id: 5, name: 'Settings खोलें', action: 'open-settings', shortcut: '⌘ ,' },
  { id: 6, name: 'Time बताओ', action: 'tell-time', shortcut: '' },
  { id: 7, name: 'Date बताओ', action: 'tell-date', shortcut: '' },
];

export default function CommandPalette({ onClose, onCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCommand = (action: string) => {
    onCommand(action);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
    >
      <motion.div
        initial={{ scale: 0.9, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-2xl rounded-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="p-4 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <Search className="text-muted" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-muted outline-none"
              autoFocus
            />
            <button
              onClick={onClose}
              className="text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.map((cmd, index) => (
            <motion.button
              key={cmd.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCommand(cmd.action)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary/10 transition-colors group"
            >
              <span className="text-white group-hover:text-primary transition-colors">
                {cmd.name}
              </span>
              {cmd.shortcut && (
                <span className="text-xs text-muted px-2 py-1 rounded bg-surface/50">
                  {cmd.shortcut}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

