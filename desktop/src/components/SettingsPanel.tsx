import { motion } from 'framer-motion';
import { X, User, Mic, Brain, Bell, Moon, Key, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { localStorageService } from '../services/local-storage-service';
import toast from 'react-hot-toast';
import { RAGSIcon } from './RAGSLogo';

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    notifications: true,
    darkMode: true,
    aiModel: 'gemini',
  });
  
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  
  useEffect(() => {
    const savedGemini = localStorageService.getAPIKey('gemini');
    const savedOpenAI = localStorageService.getAPIKey('openai');
    if (savedGemini) setGeminiKey(savedGemini);
    if (savedOpenAI) setOpenaiKey(savedOpenAI);
  }, []);
  
  const saveAPIKeys = () => {
    if (geminiKey) {
      localStorageService.saveAPIKey('gemini', geminiKey);
      const config = JSON.parse(localStorage.getItem('ragsConfig') || '{}');
      config.geminiKey = geminiKey;
      config.model = 'gemini';
      localStorage.setItem('ragsConfig', JSON.stringify(config));
    }
    if (openaiKey) {
      localStorageService.saveAPIKey('openai', openaiKey);
      const config = JSON.parse(localStorage.getItem('ragsConfig') || '{}');
      config.openaiKey = openaiKey;
      localStorage.setItem('ragsConfig', JSON.stringify(config));
    }
    toast.success('API Keys saved! RAGS is now super intelligent!');
  };

  const toggleSetting = (key: string) => {
    setSettings({ ...settings, [key]: !settings[key as keyof typeof settings] });
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
            <h2 className="text-2xl font-bold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <User className="text-primary" size={20} />
              <h3 className="text-white font-semibold">Profile</h3>
            </div>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
              defaultValue={localStorage.getItem('ragsConfig') ? JSON.parse(localStorage.getItem('ragsConfig')!).userName : ''}
            />
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="text-primary" size={20} />
                <span className="text-white">Voice Control</span>
              </div>
              <button
                onClick={() => toggleSetting('voiceEnabled')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.voiceEnabled ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-primary" size={20} />
                <span className="text-white">Notifications</span>
              </div>
              <button
                onClick={() => toggleSetting('notifications')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="text-primary" size={20} />
                <span className="text-white">Dark Mode</span>
              </div>
              <button
                onClick={() => toggleSetting('darkMode')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.darkMode ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="text-primary" size={20} />
              <h3 className="text-white font-semibold">AI Model</h3>
            </div>
            <select
              value={settings.aiModel}
              onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
              className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none"
            >
              <option value="gemini">Gemini Pro (Recommended)</option>
              <option value="gpt-4">GPT-4 (Online)</option>
              <option value="local">Local (Offline)</option>
            </select>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Key className="text-primary" size={20} />
              <h3 className="text-white font-semibold">API Keys (Stored Locally)</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted mb-1 block">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIza..." 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none text-sm"
                />
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Get Gemini API Key (Free)
                </a>
              </div>
              
              <div>
                <label className="text-sm text-muted mb-1 block">OpenAI API Key (Optional)</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-dark/50 text-white px-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              
              <button
                onClick={saveAPIKeys}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save API Keys
              </button>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm">Local Storage</span>
              <span className="text-primary text-xs">{localStorageService.getStorageSize()}</span>
            </div>
            <p className="text-xs text-muted">All data stored locally on your Mac. 100% Private.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
