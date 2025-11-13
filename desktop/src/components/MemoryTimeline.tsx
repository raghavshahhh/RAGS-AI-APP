import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Tag, Clock, MessageSquare } from 'lucide-react';

interface Memory {
  id: string;
  timestamp: Date;
  type: 'conversation' | 'note' | 'reminder' | 'action';
  content: string;
  tags: string[];
}

export default function MemoryTimeline() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Mock data - will be replaced with real API call
  const memories: Memory[] = [
    {
      id: '1',
      timestamp: new Date(),
      type: 'conversation',
      content: 'Discussed project timeline and deliverables',
      tags: ['work', 'project'],
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000),
      type: 'note',
      content: 'Remember to buy groceries',
      tags: ['personal', 'todo'],
    },
  ];

  const filteredMemories = memories.filter((memory) =>
    memory.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: Memory['type']) => {
    switch (type) {
      case 'conversation':
        return <MessageSquare className="w-4 h-4" />;
      case 'note':
        return <Tag className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Memory['type']) => {
    switch (type) {
      case 'conversation':
        return 'from-primary to-blue-500';
      case 'note':
        return 'from-secondary to-purple-500';
      default:
        return 'from-green-500 to-emerald-500';
    }
  };

  return (
    <div className="w-full h-full bg-dark/50 backdrop-blur-xl rounded-2xl border border-primary/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-white">Memory Timeline</h2>
        </div>
        <div className="flex gap-2">
          {(['all', 'today', 'week', 'month'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === filter
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-surface/50 text-muted hover:text-white'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {filteredMemories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8 pb-8 border-l-2 border-primary/30 last:border-l-0 last:pb-0"
            >
              {/* Timeline dot */}
              <div className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r ${getTypeColor(memory.type)}`} />

              {/* Memory card */}
              <div className="bg-surface/30 backdrop-blur-sm rounded-xl p-4 border border-primary/10 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getTypeColor(memory.type)}`}>
                      {getTypeIcon(memory.type)}
                    </div>
                    <span className="text-sm text-muted">
                      {memory.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {memory.timestamp.toLocaleDateString()}
                  </span>
                </div>

                <p className="text-white mb-3">{memory.content}</p>

                <div className="flex gap-2">
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMemories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted">No memories found</p>
          </div>
        )}
      </div>
    </div>
  );
}

