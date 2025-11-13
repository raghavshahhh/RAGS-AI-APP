import { motion } from 'framer-motion';
import { Zap, Calendar, Settings, FileText, Bell, Globe, Activity } from 'lucide-react';

interface QuickActionsProps {
  onAutomateClick: () => void;
  onScheduleClick: () => void;
  onSettingsClick: () => void;
  onNotesClick: () => void;
  onRemindersClick: () => void;
  onBrowserClick: () => void;
  onMonitorClick: () => void;
}

const actions = [
  { icon: FileText, label: 'Notes', color: 'from-indigo-500 to-purple-500' },
  { icon: Bell, label: 'Reminders', color: 'from-orange-500 to-red-500' },
  { icon: Zap, label: 'Automate', color: 'from-yellow-500 to-orange-500' },
  { icon: Globe, label: 'Browser', color: 'from-blue-500 to-purple-500' },
  { icon: Activity, label: 'Monitor', color: 'from-green-500 to-emerald-500' },
  { icon: Calendar, label: 'Schedule', color: 'from-teal-500 to-cyan-500' },
  { icon: Settings, label: 'Settings', color: 'from-purple-500 to-pink-500' },
];

export default function QuickActions({ onNotesClick, onRemindersClick, onAutomateClick, onBrowserClick, onMonitorClick, onScheduleClick, onSettingsClick }: QuickActionsProps) {
  const handlers = [onNotesClick, onRemindersClick, onAutomateClick, onBrowserClick, onMonitorClick, onScheduleClick, onSettingsClick];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex gap-3 flex-wrap justify-center max-w-4xl"
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlers[index]}
          className="glass p-4 rounded-2xl group relative overflow-hidden"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 transition-opacity`} />
          <action.icon className="text-muted group-hover:text-primary transition-colors" size={24} />
          <p className="text-xs text-muted mt-2 group-hover:text-white transition-colors">{action.label}</p>
        </motion.button>
      ))}
    </motion.div>
  );
}

