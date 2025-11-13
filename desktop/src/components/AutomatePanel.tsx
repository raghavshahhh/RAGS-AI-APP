import { motion } from 'framer-motion';
import { X, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { RAGSIcon } from './RAGSLogo';

interface AutomatePanelProps {
  onClose: () => void;
}

export default function AutomatePanel({ onClose }: AutomatePanelProps) {
  const [automations, setAutomations] = useState([
    { id: 1, name: 'Morning Routine', active: true, tasks: ['Open Calendar', 'Check Weather', 'Read News'] },
    { id: 2, name: 'Work Mode', active: false, tasks: ['Open VS Code', 'Start Music', 'Block Social Media'] },
  ]);

  const toggleAutomation = (id: number) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, active: !a.active } : a
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass w-[600px] max-h-[80vh] rounded-3xl p-6 overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RAGSIcon size={40} />
            <h2 className="text-2xl font-bold text-white">Automations</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <button className="w-full glass p-4 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-colors mb-4">
          <Plus size={20} />
          <span>Create New Automation</span>
        </button>

        <div className="space-y-3">
          {automations.map((automation) => (
            <div key={automation.id} className="glass p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">{automation.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAutomation(automation.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      automation.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {automation.active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {automation.tasks.map((task, i) => (
                  <p key={i} className="text-sm text-muted">• {task}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
