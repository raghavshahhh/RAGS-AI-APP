import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Zap, Brain, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Personality {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
  color: string;
  example: string;
}

const personalities: Personality[] = [
  {
    id: 'jarvis',
    name: 'JARVIS',
    description: 'Professional, efficient, and precise',
    icon: <Brain className="w-6 h-6" />,
    tone: 'professional',
    color: 'from-cyan-500 to-blue-500',
    example: '"Certainly, sir. I have analyzed the data and prepared a comprehensive report."',
  },
  {
    id: 'friday',
    name: 'FRIDAY',
    description: 'Friendly, casual, and supportive',
    icon: <Heart className="w-6 h-6" />,
    tone: 'friendly',
    color: 'from-pink-500 to-rose-500',
    example: '"Hey! I got you covered. Let me help you with that right away!"',
  },
  {
    id: 'ultron',
    name: 'ULTRON',
    description: 'Sarcastic, witty, and direct',
    icon: <Zap className="w-6 h-6" />,
    tone: 'sarcastic',
    color: 'from-red-500 to-orange-500',
    example: '"Oh, another task? How delightful. Let me add it to the endless list."',
  },
  {
    id: 'vision',
    name: 'VISION',
    description: 'Philosophical, thoughtful, and wise',
    icon: <Sparkles className="w-6 h-6" />,
    tone: 'philosophical',
    color: 'from-purple-500 to-indigo-500',
    example: '"An interesting question. Let us contemplate the deeper implications..."',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own personality',
    icon: <User className="w-6 h-6" />,
    tone: 'custom',
    color: 'from-green-500 to-emerald-500',
    example: '"Design your own AI personality with custom traits and behaviors."',
  },
];

export default function PersonalitySelector() {
  const [selectedPersonality, setSelectedPersonality] = useState('jarvis');

  const handleSelectPersonality = (id: string) => {
    setSelectedPersonality(id);
    const personality = personalities.find((p) => p.id === id);
    toast.success(`Switched to ${personality?.name} mode`, {
      icon: '🎭',
      style: {
        background: '#1a1f3a',
        color: '#fff',
        border: '1px solid rgba(0, 217, 255, 0.2)',
      },
    });
  };

  return (
    <div className="w-full bg-dark/50 backdrop-blur-xl rounded-2xl border border-primary/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Personality</h2>
          <p className="text-sm text-muted">Choose how your AI assistant responds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalities.map((personality) => (
          <motion.button
            key={personality.id}
            onClick={() => handleSelectPersonality(personality.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              selectedPersonality === personality.id
                ? 'border-primary bg-primary/10'
                : 'border-primary/20 bg-surface/30 hover:border-primary/40'
            }`}
          >
            {/* Selected indicator */}
            {selectedPersonality === personality.id && (
              <motion.div
                layoutId="selected"
                className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Icon */}
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${personality.color} mb-4`}>
              {personality.icon}
            </div>

            {/* Name & Description */}
            <h3 className="text-lg font-bold text-white mb-2">{personality.name}</h3>
            <p className="text-sm text-muted mb-4">{personality.description}</p>

            {/* Example */}
            <div className="bg-dark/50 rounded-lg p-3 border border-primary/10">
              <p className="text-xs text-muted mb-1">Example:</p>
              <p className="text-sm text-white/80 italic">{personality.example}</p>
            </div>

            {/* Tone badge */}
            <div className="mt-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${personality.color} text-white`}>
                {personality.tone}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom personality builder (placeholder) */}
      {selectedPersonality === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 p-6 bg-surface/30 rounded-xl border border-primary/20"
        >
          <h3 className="text-lg font-bold text-white mb-4">Custom Personality Builder</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-2">Personality Name</label>
              <input
                type="text"
                placeholder="e.g., My Assistant"
                className="w-full bg-dark/50 border border-primary/20 rounded-lg px-4 py-2 text-white placeholder-muted focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-2">Tone</label>
              <select className="w-full bg-dark/50 border border-primary/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50">
                <option>Professional</option>
                <option>Casual</option>
                <option>Humorous</option>
                <option>Formal</option>
              </select>
            </div>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:scale-105 transition-transform">
              Create Personality
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

