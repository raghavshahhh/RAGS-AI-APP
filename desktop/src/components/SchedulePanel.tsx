import { motion } from 'framer-motion';
import { X, Plus, Clock } from 'lucide-react';
import { useState } from 'react';
import { RAGSIcon } from './RAGSLogo';

interface SchedulePanelProps {
  onClose: () => void;
}

export default function SchedulePanel({ onClose }: SchedulePanelProps) {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Team Meeting', time: '10:00 AM', date: 'Today' },
    { id: 2, title: 'Code Review', time: '2:00 PM', date: 'Today' },
    { id: 3, title: 'Gym', time: '6:00 PM', date: 'Today' },
  ]);

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
            <h2 className="text-2xl font-bold text-white">Schedule</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <button className="w-full glass p-4 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-colors mb-4">
          <Plus size={20} />
          <span>Add New Task</span>
        </button>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="glass p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">{task.title}</h3>
                <p className="text-sm text-muted">{task.date}</p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Clock size={16} />
                <span className="text-sm">{task.time}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
