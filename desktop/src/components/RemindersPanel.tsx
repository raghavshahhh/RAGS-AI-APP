import { motion } from 'framer-motion';
import { X, Plus, Clock, Bell, Trash2, Check, AlarmClock } from 'lucide-react';
import { RAGSIcon } from './RAGSLogo';
import { useState, useEffect } from 'react';
import { remindersService, Reminder } from '../services/remindersService';
import toast from 'react-hot-toast';

interface RemindersPanelProps {
  onClose: () => void;
}

export default function RemindersPanel({ onClose }: RemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    loadReminders();
  }, [filterStatus]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await remindersService.getAllReminders(filterStatus);
      setReminders(data);
    } catch (error) {
      toast.error('Failed to load reminders');
    }
    setLoading(false);
  };

  const createReminder = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!remindAt) {
      toast.error('Date/time is required');
      return;
    }

    try {
      const newReminder = await remindersService.createReminder({
        title,
        description,
        remind_at: remindAt,
        repeat,
        priority
      });
      
      setReminders([newReminder, ...reminders]);
      toast.success('Reminder created!');
      resetForm();
      setShowCreate(false);
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  const completeReminder = async (id: string) => {
    try {
      await remindersService.completeReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Reminder completed!');
    } catch (error) {
      toast.error('Failed to complete reminder');
    }
  };

  const snoozeReminder = async (id: string) => {
    try {
      await remindersService.snoozeReminder(id, 10);
      toast.success('Reminder snoozed for 10 minutes');
      loadReminders();
    } catch (error) {
      toast.error('Failed to snooze reminder');
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    
    try {
      await remindersService.deleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Reminder deleted!');
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRemindAt('');
    setRepeat('none');
    setPriority('medium');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 0) return 'Overdue';
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `In ${hours} hours`;
    const days = Math.floor(hours / 24);
    return `In ${days} days`;
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
        className="glass w-[700px] max-h-[80vh] rounded-3xl p-6 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RAGSIcon size={40} />
            <div>
              <h2 className="text-2xl font-bold text-white">Reminders</h2>
              <p className="text-xs text-muted">Never forget anything</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {['pending', 'completed', 'snoozed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === status 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-muted hover:bg-dark/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Create Button */}
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full glass p-4 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-colors mb-4"
          >
            <Plus size={20} />
            <span>Create New Reminder</span>
          </button>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="glass p-4 rounded-xl mb-4 space-y-3">
            <input
              type="text"
              placeholder="Reminder title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none resize-none"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Date & Time</label>
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Repeat</label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as any)}
                className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createReminder}
                className="flex-1 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform"
              >
                Create Reminder
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center text-muted py-8">Loading...</div>
          ) : reminders.length === 0 ? (
            <div className="text-center text-muted py-8">No {filterStatus} reminders</div>
          ) : (
            reminders.map(reminder => (
              <div key={reminder.id} className="glass p-4 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{reminder.title}</h3>
                    {reminder.description && (
                      <p className="text-sm text-muted mt-1">{reminder.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(reminder.priority)}`}>
                    {reminder.priority}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(reminder.remind_at)}
                  </div>
                  {reminder.repeat !== 'none' && (
                    <div className="flex items-center gap-1">
                      <Bell size={12} />
                      {reminder.repeat}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {reminder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => completeReminder(reminder.id)}
                        className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check size={14} />
                        Complete
                      </button>
                      <button
                        onClick={() => snoozeReminder(reminder.id)}
                        className="flex-1 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <AlarmClock size={14} />
                        Snooze
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
