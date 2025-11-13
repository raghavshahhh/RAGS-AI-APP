import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Brain, Camera, Monitor, Search, Settings, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onComplete: (config: any) => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    model: 'ollama',
    openaiKey: '',
    geminiKey: '',
    userName: '',
  });
  const [hasSpoken, setHasSpoken] = useState(false);

  // RAGS voice with better quality
  const speakWelcome = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech first
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slower for clarity
      utterance.pitch = 0.9; // Lower pitch for male voice
      utterance.volume = 0.9;
      
      // Wait for voices to load
      const setVoice = () => {
        const voices = speechSynthesis.getVoices();
        // Find best male voice
        const maleVoice = voices.find(voice => 
          voice.name.includes('Alex') || // macOS male voice
          voice.name.includes('Daniel') ||
          voice.name.includes('Fred') ||
          (voice.name.includes('Google') && voice.name.includes('Male')) ||
          voice.lang.includes('en') && voice.name.toLowerCase().includes('male')
        ) || voices.find(voice => voice.lang.includes('en-US'));
        
        if (maleVoice) {
          utterance.voice = maleVoice;
          console.log('Using voice:', maleVoice.name);
        }
        
        speechSynthesis.speak(utterance);
      };
      
      if (speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        speechSynthesis.onvoiceschanged = setVoice;
      }
    }
  };

  // Welcome voice on component mount - only once
  useEffect(() => {
    if (!hasSpoken && step === 0) {
      const timer = setTimeout(() => {
        speakWelcome("Namaste! Main RAGS hun, aapka personal AI assistant. Welcome to your new AI operating system!");
        setHasSpoken(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Voice for different steps - controlled
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (step === 1) {
      timer = setTimeout(() => {
        speakWelcome("Choose your AI model. Offline Ollama is recommended for privacy.");
      }, 800);
    } else if (step === 2) {
      timer = setTimeout(() => {
        speakWelcome("What should I call you? Please enter your name.");
      }, 800);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step]);

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Voice Control",
      desc: "Say 'Hey RAGS' anytime - Complete offline voice processing"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Brain",
      desc: "Local Ollama or Cloud AI (OpenAI/Gemini) - Your choice"
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "Mac Control",
      desc: "Complete system automation - Apps, files, settings"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Vision System",
      desc: "Camera access, screen reading, visual intelligence"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Research Engine",
      desc: "Web search, knowledge gathering, real-time info"
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Memory System",
      desc: "Remembers everything, learns your preferences"
    }
  ];

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      speakWelcome(`Perfect ${config.userName}! Let me start your RAGS AI system. This will take a few moments.`);
      setTimeout(() => {
        onComplete(config);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-surface to-dark flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full"
      >
        {step === 0 && (
          <div className="text-center">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="mb-8"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-4xl font-bold text-white">R</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">
                Welcome to RAGS AI
              </h1>
              <p className="text-xl text-muted mb-4">
                Your Personal AI Operating System - Like JARVIS, but Real
              </p>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-primary mb-8 flex items-center justify-center gap-2"
              >
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm">RAGS is speaking...</span>
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-6 rounded-2xl text-center"
                >
                  <div className="text-primary mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold flex items-center gap-3 mx-auto"
            >
              Get Started
              <ArrowRight size={20} />
            </motion.button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">
              Choose Your AI Model
            </h2>
            
            <div className="space-y-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setConfig({...config, model: 'ollama'})}
                className={`glass p-6 rounded-2xl cursor-pointer border-2 transition-colors ${
                  config.model === 'ollama' ? 'border-primary' : 'border-transparent'
                }`}
              >
                <h3 className="text-xl font-semibold text-white mb-2">
                  🏠 Offline (Ollama) - Recommended
                </h3>
                <p className="text-muted">
                  100% Private, Fast, No Internet Required - Perfect for daily use
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setConfig({...config, model: 'openai'})}
                className={`glass p-6 rounded-2xl cursor-pointer border-2 transition-colors ${
                  config.model === 'openai' ? 'border-primary' : 'border-transparent'
                }`}
              >
                <h3 className="text-xl font-semibold text-white mb-2">
                  🚀 OpenAI (GPT-4)
                </h3>
                <p className="text-muted">
                  Most powerful, requires API key and internet
                </p>
                {config.model === 'openai' && (
                  <input
                    type="password"
                    placeholder="Enter OpenAI API Key"
                    value={config.openaiKey}
                    onChange={(e) => setConfig({...config, openaiKey: e.target.value})}
                    className="mt-4 w-full px-4 py-2 bg-dark/50 border border-primary/30 rounded-lg text-white"
                  />
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setConfig({...config, model: 'gemini'})}
                className={`glass p-6 rounded-2xl cursor-pointer border-2 transition-colors ${
                  config.model === 'gemini' ? 'border-primary' : 'border-transparent'
                }`}
              >
                <h3 className="text-xl font-semibold text-white mb-2">
                  🧠 Google Gemini
                </h3>
                <p className="text-muted">
                  Advanced reasoning, requires API key and internet
                </p>
                {config.model === 'gemini' && (
                  <input
                    type="password"
                    placeholder="Enter Gemini API Key"
                    value={config.geminiKey}
                    onChange={(e) => setConfig({...config, geminiKey: e.target.value})}
                    className="mt-4 w-full px-4 py-2 bg-dark/50 border border-primary/30 rounded-lg text-white"
                  />
                )}
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold flex items-center gap-3 mx-auto"
            >
              Continue
              <ArrowRight size={20} />
            </motion.button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">
              What should I call you?
            </h2>
            
            <input
              type="text"
              placeholder="Enter your name"
              value={config.userName}
              onChange={(e) => setConfig({...config, userName: e.target.value})}
              className="w-full px-6 py-4 bg-dark/50 border border-primary/30 rounded-2xl text-white text-center text-xl mb-8"
              autoFocus
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              disabled={!config.userName.trim()}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold flex items-center gap-3 mx-auto disabled:opacity-50"
            >
              Start RAGS AI
              <ArrowRight size={20} />
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}