import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeoEyes from './components/NeoEyes';
import VoiceVisualizer from './components/VoiceVisualizer';
import CommandPalette from './components/CommandPalette';
import QuickActions from './components/QuickActions';
import StatusBar from './components/StatusBar';
import ChatPanel from './components/ChatPanel';
import ChatSidebar from './components/ChatSidebar';
import VoiceInputBox from './components/VoiceInputBox';
import AutomatePanel from './components/AutomatePanel';
import SchedulePanel from './components/SchedulePanel';
import SettingsPanel from './components/SettingsPanel';
import NotesPanel from './components/NotesPanel';
import RemindersPanel from './components/RemindersPanel';
import BrowserControlPanel from './components/BrowserControlPanel';
import SystemMonitorPanel from './components/SystemMonitorPanel';
import CameraCapture from './components/CameraCapture';
import CameraView from './components/CameraView';
import RAGSLogo from './components/RAGSLogo';
import { useStore } from './store/useStore';
import { Command, Power, PowerOff, Camera } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import faceAnimationService from './services/faceAnimationService';

function App() {
  const { isListening, setIsListening, addMessage } = useStore();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAutomate, setShowAutomate] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [ragsRunning, setRagsRunning] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState<'calm' | 'curious' | 'angry' | 'happy' | 'thinking' | 'neutral'>('calm');
  const [audioData, setAudioData] = useState<Float32Array | undefined>(undefined);
  const [interimTranscript, setInterimTranscript] = useState('');

  // Map backend emotions to Neo emotions
  const mapEmotion = (backendEmotion: string): 'calm' | 'curious' | 'angry' | 'happy' | 'thinking' | 'neutral' => {
    const emotionMap: Record<string, 'calm' | 'curious' | 'angry' | 'happy' | 'thinking' | 'neutral'> = {
      'neutral': 'calm',
      'happy': 'happy',
      'excited': 'happy',
      'sad': 'calm',
      'angry': 'angry',
      'thinking': 'thinking',
      'curious': 'curious',
      'surprised': 'curious',
      'sleepy': 'calm',
    };
    return emotionMap[backendEmotion] || 'calm';
  };

  // Initialize face animation service
  useEffect(() => {
    faceAnimationService.connectToBackend();

    // Listen for emotion changes
    faceAnimationService.onEmotionChange((emotionData) => {
      setEmotion(mapEmotion(emotionData.emotion));
    });

    // Listen for voice activity
    faceAnimationService.onVoiceActivityChange((voiceData) => {
      setIsListening(voiceData.isListening);
      setIsSpeaking(voiceData.isSpeaking);
      if (voiceData.audioData) {
        setAudioData(voiceData.audioData);
      }
    });

    return () => {
      faceAnimationService.disconnect();
    };
  }, []);

  // Auto-initialize backend on startup
  useEffect(() => {
    const initBackend = async () => {
      try {
        await fetch('http://localhost:3000/api/real-ai/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'user1' })
        });
        console.log('✅ Backend initialized');
      } catch (error) {
        console.log('⚠️ Backend not available yet');
      }
    };
    
    // Initialize after 1 second
    const timer = setTimeout(initBackend, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
        e.preventDefault();
        toggleVoice();
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowChat(false);
        setShowAutomate(false);
        setShowSchedule(false);
        setShowSettings(false);
        setShowCamera(false);
        setShowNotes(false);
        setShowReminders(false);
        setShowBrowser(false);
        setShowMonitor(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleRAGS = () => {
    setRagsRunning(!ragsRunning);
    toast(ragsRunning ? 'RAGS stopped' : 'RAGS started');
  };

  const toggleVoice = () => {
    if (!ragsRunning) {
      toast.error('RAGS is not running');
      return;
    }

    if (!isListening) {
      // Start listening
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Voice not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;  // Show text while speaking
      recognition.lang = 'en-IN';  // Indian English - Hinglish in Roman script

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;
        
        console.log('🎤 Heard:', transcript, isFinal ? '(final)' : '(interim)');
        
        // Show interim text in input box
        if (!isFinal) {
          // Update interim text in input box
          setInterimTranscript(transcript);
          console.log('📝 Showing in box:', transcript);
        } else {
          // Final text - clear interim and send to chat
          setInterimTranscript('');
          console.log('✅ Final text:', transcript);
          handleVoiceInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't stop on "no-speech" error - just restart
        if (event.error === 'no-speech') {
          console.log('⚠️ No speech detected, continuing to listen...');
          return; // Don't stop, let onend restart
        }
        
        // For other errors, try to restart
        if (event.error !== 'aborted') {
          console.log('🔄 Error occurred, attempting restart...');
          setTimeout(() => {
            if (isListening) {
              try {
                recognition.start();
                console.log('✅ Restarted after error');
              } catch (e) {
                console.error('Failed to restart:', e);
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        console.log('🔄 Recognition ended, isListening:', isListening);
        if (isListening) {
          setTimeout(() => {
            try {
              recognition.start();
              console.log('✅ Auto-restarted recognition');
            } catch (e) {
              console.error('Failed to restart:', e);
            }
          }, 100);
        }
      };

      recognition.start();
      setIsListening(true);
      toast.success('🎤 Listening...');
      
      // Store recognition instance
      (window as any).currentRecognition = recognition;
    } else {
      // Stop listening
      if ((window as any).currentRecognition) {
        (window as any).currentRecognition.stop();
        (window as any).currentRecognition = null;
      }
      setIsListening(false);
      setInterimTranscript('');  // Clear interim text
      toast('⏸️ Voice stopped');
    }
  };

  const executeAction = (action: any) => {
    console.log('🎬 Executing action:', action);
    
    try {
      switch (action.type) {
        case 'search':
          // Open Google search with query
          if (action.query) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(action.query)}`;
            window.open(searchUrl, '_blank');
            toast.success(`🔍 Searching: ${action.query}`);
          }
          break;
          
        case 'open_browser':
          // Open default browser homepage
          window.open('https://www.google.com', '_blank');
          toast.success('🌐 Browser opened');
          break;
          
        case 'open_youtube':
          // Open YouTube with optional search
          if (action.query) {
            const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(action.query)}`;
            window.open(youtubeUrl, '_blank');
            toast.success(`▶️ YouTube: ${action.query}`);
          } else {
            window.open('https://www.youtube.com', '_blank');
            toast.success('▶️ YouTube opened');
          }
          break;
          
        case 'scroll':
          // Scroll page
          if (action.direction === 'down') {
            window.scrollBy({ top: 500, behavior: 'smooth' });
            toast.success('📜 Scrolling down');
          } else if (action.direction === 'up') {
            window.scrollBy({ top: -500, behavior: 'smooth' });
            toast.success('📜 Scrolling up');
          }
          break;
          
        case 'select_option':
          // Select option using browser automation
          fetch('http://localhost:3000/api/browser-control/select-option', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ optionNumber: action.number })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              toast.success(`✅ Selected option ${action.number}`);
            } else {
              toast.error(`⚠️ ${data.error || 'Selection failed'}`);
            }
          })
          .catch(err => {
            console.error('Select option failed:', err);
            toast.error('⚠️ Browser automation not available');
          });
          break;
          
        case 'click':
          // Click element using browser automation
          fetch('http://localhost:3000/api/browser-control/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: action.target })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              toast.success(`✅ Clicked ${action.target}`);
            } else {
              toast.error(`⚠️ ${data.error || 'Click failed'}`);
            }
          })
          .catch(err => {
            console.error('Click failed:', err);
            toast.error('⚠️ Browser automation not available');
          });
          break;
          
        case 'camera_view':
        case 'camera_identify':
          // Camera vision - answer question about what's visible
          fetch('http://localhost:3000/api/camera-vision/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: action.question })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // Add AI response about what it sees
              addMessage({
                id: Date.now().toString(),
                role: 'assistant',
                content: data.answer,
                timestamp: new Date(),
              });
              toast.success('👁️ Camera analyzed!');
            } else {
              toast.error(`⚠️ ${data.error || 'Camera vision failed'}`);
              if (data.hint) {
                toast(data.hint);
              }
            }
          })
          .catch(err => {
            console.error('Camera vision failed:', err);
            toast.error('⚠️ Camera vision not available');
          });
          break;

        case 'remember':
          // Store memory
          toast.success(`💾 Remembered: ${action.content.substring(0, 50)}...`);
          break;

        case 'recall':
          // Recall handled by backend, just show loading
          toast('🔍 Checking memory...');
          break;

        case 'open_app':
          // Open application
          toast.success(`📱 Opening ${action.app}...`);
          break;

        case 'open_file':
          // Open file/folder
          toast.success(`📁 Opening ${action.path}...`);
          break;

        case 'volume_up':
          toast.success('🔊 Volume increased');
          break;

        case 'volume_down':
          toast.success('🔉 Volume decreased');
          break;

        case 'screenshot':
          toast.success('📸 Screenshot taken!');
          break;

        case 'notification':
          toast.success('🔔 Notification sent');
          break;

        case 'add_reminder':
          toast.success(`⏰ Reminder added: ${action.content.substring(0, 30)}...`);
          break;

        case 'show_reminders':
          toast('📋 Checking reminders...');
          break;

        case 'autopilot_start':
          toast.success('🤖 Autopilot activated!');
          break;

        case 'autopilot_stop':
          toast('🛑 Autopilot deactivated');
          break;

        case 'register_face':
          toast.success(`👤 Face registered: ${action.name}`);
          break;

        case 'camera_vision':
          toast('📷 Analyzing camera...');
          break;
          
        default:
          console.log('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('❌ Action execution error:', error);
      toast.error('Action failed');
    }
  };

  const handleVoiceInput = async (text: string) => {
    if (!text || text.trim().length < 3) return;

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    });

    try {
      setEmotion('thinking');
      const response = await fetch('http://localhost:3000/api/real-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.response || !data.response.text) {
        throw new Error('Invalid response format');
      }

      const responseText = data.response.text;
      
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      });

      // Execute action if present
      if (data.response.action) {
        executeAction(data.response.action);
      }

      // Detect emotion from response
      const lower = responseText.toLowerCase();
      if (lower.includes('great') || lower.includes('awesome')) setEmotion(mapEmotion('excited'));
      else if (lower.includes('sorry')) setEmotion('calm');
      else setEmotion('happy');

      // ✅ BACKEND IS ALREADY SPEAKING via Edge-TTS/SimpleTTS
      // Desktop app TTS DISABLED to prevent double voice
      console.log('🔊 Backend is speaking via Edge-TTS/SimpleTTS');
      console.log('💡 Desktop app TTS disabled (prevents double voice)');
      
      // Just update UI state - no browser TTS
      setIsSpeaking(true);
      setTimeout(() => {
        setIsSpeaking(false);
        setEmotion('neutral');
      }, responseText.length * 50); // Estimate speaking duration

    } catch (error) {
      console.error('❌ Chat error:', error);
      
      // Add error message to chat
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please make sure the backend is running.',
        timestamp: new Date(),
      });
      
      toast.error('Backend connection failed');
      setIsSpeaking(false);
      setEmotion('calm');
    }
  };


  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full opacity-20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      {/* Camera View */}
      <CameraView />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <RAGSLogo size={40} animated={isListening} />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">RAGS AI</h1>
            <p className="text-xs text-muted">Your Personal AI Assistant</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass px-3 py-2 rounded-xl flex items-center gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
              <span className="text-xs text-green-400">Listening</span>
            </motion.div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleRAGS}
            className={`glass px-4 py-2 rounded-xl flex items-center gap-2 ${
              ragsRunning ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {ragsRunning ? <Power size={16} /> : <PowerOff size={16} />}
            <span className="text-sm">{ragsRunning ? 'ON' : 'OFF'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCamera(true)}
            className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-muted hover:text-primary"
          >
            <Camera size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCommandPalette(true)}
            className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-muted hover:text-primary"
          >
            <Command size={16} />
            <span className="text-sm">⌘K</span>
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center h-full pt-20 pb-32">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <NeoEyes
            emotion={emotion}
            isSpeaking={isSpeaking}
            audioLevel={audioData ? Math.max(...Array.from(audioData)) : 0}
          />
        </motion.div>

        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8"
          >
            <VoiceVisualizer />
          </motion.div>
        )}
      </div>

      {/* Voice Input Box */}
      <VoiceInputBox 
        isListening={isListening}
        onSend={handleVoiceInput}
        onToggleVoice={toggleVoice}
        interimTranscript={interimTranscript}
      />

      {/* Quick Actions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <QuickActions 
          onNotesClick={() => setShowNotes(true)}
          onRemindersClick={() => setShowReminders(true)}
          onAutomateClick={() => setShowAutomate(true)}
          onBrowserClick={() => setShowBrowser(true)}
          onMonitorClick={() => setShowMonitor(true)}
          onScheduleClick={() => setShowSchedule(true)}
          onSettingsClick={() => setShowSettings(true)}
        />
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Chat Sidebar - Always Visible */}
      <ChatSidebar />

      {/* Panels */}
      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette 
            onClose={() => setShowCommandPalette(false)}
            onCommand={(cmd) => {
              if (cmd === 'start-voice') toggleVoice();
              if (cmd === 'open-chat') {};
              if (cmd === 'open-automate') setShowAutomate(true);
              if (cmd === 'open-schedule') setShowSchedule(true);
              if (cmd === 'open-settings') setShowSettings(true);
            }}
          />
        )}
        {showChat && <ChatPanel onClose={() => setShowChat(false)} />}
        {showNotes && <NotesPanel onClose={() => setShowNotes(false)} />}
        {showReminders && <RemindersPanel onClose={() => setShowReminders(false)} />}
        {showAutomate && <AutomatePanel onClose={() => setShowAutomate(false)} />}
        {showBrowser && <BrowserControlPanel onClose={() => setShowBrowser(false)} />}
        {showMonitor && <SystemMonitorPanel onClose={() => setShowMonitor(false)} />}
        {showSchedule && <SchedulePanel onClose={() => setShowSchedule(false)} />}
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {showCamera && (
          <CameraCapture
            onClose={() => setShowCamera(false)}
            onCapture={(_imageData) => {
              toast.success('Photo captured!');
              setShowCamera(false);
            }}
          />
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
