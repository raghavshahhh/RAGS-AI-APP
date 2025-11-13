/**
 * 🎤 ENHANCED VOICE ASSISTANT
 * Advanced voice interaction with real-time feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Settings, 
  Zap,
  Brain,
  Waves,
  Activity
} from 'lucide-react';

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  confidence: number;
  volume: number;
}

interface VoiceSettings {
  language: string;
  voiceSpeed: number;
  voiceVolume: number;
  wakeWordEnabled: boolean;
  continuousListening: boolean;
}

const EnhancedVoiceAssistant: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0,
    volume: 0
  });

  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'en-US',
    voiceSpeed: 1.0,
    voiceVolume: 0.8,
    wakeWordEnabled: true,
    continuousListening: false
  });

  const [showSettings, setShowSettings] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [response, setResponse] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize audio context for visualizations
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Audio visualization
  const updateAudioData = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Convert to normalized array for visualization
    const normalizedData = Array.from(dataArray).map(value => value / 255);
    setAudioData(normalizedData.slice(0, 32)); // Use first 32 frequency bins

    // Calculate volume level
    const volume = normalizedData.reduce((sum, value) => sum + value, 0) / normalizedData.length;
    setVoiceState(prev => ({ ...prev, volume }));

    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  };

  // Start listening
  const startListening = async () => {
    try {
      setVoiceState(prev => ({ ...prev, isListening: true, transcript: '' }));
      
      // Start audio visualization
      if (audioContextRef.current && analyserRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        updateAudioData();
      }

      // Simulate voice recognition (replace with actual implementation)
      setTimeout(() => {
        setVoiceState(prev => ({ 
          ...prev, 
          transcript: 'Hey RAGS, what\'s the weather like?',
          confidence: 0.95
        }));
      }, 2000);

    } catch (error) {
      console.error('Failed to start listening:', error);
      setVoiceState(prev => ({ ...prev, isListening: false }));
    }
  };

  // Stop listening
  const stopListening = () => {
    setVoiceState(prev => ({ ...prev, isListening: false }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Process voice command
  const processCommand = async (transcript: string) => {
    setVoiceState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Send to backend for processing
      const response = await fetch('http://localhost:3000/api/real-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcript })
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data.response || 'I heard you, but I\'m not sure how to respond.');
        
        // Simulate speaking
        setVoiceState(prev => ({ ...prev, isSpeaking: true, isProcessing: false }));
        
        // Simulate speech duration
        setTimeout(() => {
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to process command:', error);
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Handle voice button click
  const handleVoiceToggle = () => {
    if (voiceState.isListening) {
      stopListening();
      if (voiceState.transcript) {
        processCommand(voiceState.transcript);
      }
    } else {
      startListening();
    }
  };

  // Get button color based on state
  const getButtonColor = () => {
    if (voiceState.isSpeaking) return 'bg-purple-500 border-purple-400';
    if (voiceState.isProcessing) return 'bg-yellow-500 border-yellow-400';
    if (voiceState.isListening) return 'bg-red-500 border-red-400';
    return 'bg-blue-500 border-blue-400';
  };

  // Get status text
  const getStatusText = () => {
    if (voiceState.isSpeaking) return 'Speaking...';
    if (voiceState.isProcessing) return 'Processing...';
    if (voiceState.isListening) return 'Listening...';
    return 'Ready to listen';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mic className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Voice Assistant</h2>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Voice Interface */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
        {/* Voice Button */}
        <motion.button
          onClick={handleVoiceToggle}
          disabled={voiceState.isProcessing}
          className={`w-32 h-32 rounded-full ${getButtonColor()} border-4 flex items-center justify-center transition-all duration-300 mx-auto mb-6 disabled:opacity-50`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: voiceState.isListening ? [1, 1.1, 1] : 1,
            boxShadow: voiceState.isListening 
              ? '0 0 30px rgba(59, 130, 246, 0.5)' 
              : '0 0 10px rgba(59, 130, 246, 0.2)'
          }}
          transition={{
            scale: { duration: 1, repeat: voiceState.isListening ? Infinity : 0 },
            boxShadow: { duration: 0.3 }
          }}
        >
          {voiceState.isSpeaking ? (
            <Volume2 className="w-12 h-12 text-white" />
          ) : voiceState.isProcessing ? (
            <Brain className="w-12 h-12 text-white" />
          ) : voiceState.isListening ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Waves className="w-12 h-12 text-white" />
            </motion.div>
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </motion.button>

        {/* Status */}
        <p className="text-lg font-medium text-white mb-2">{getStatusText()}</p>
        
        {/* Volume Indicator */}
        {voiceState.isListening && (
          <div className="flex items-center justify-center space-x-2 mb-4">
            <VolumeX className="w-4 h-4 text-gray-400" />
            <div className="w-32 h-2 bg-gray-700 rounded-full">
              <motion.div
                className="h-2 bg-blue-400 rounded-full"
                animate={{ width: `${voiceState.volume * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <Volume2 className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Audio Visualization */}
        {voiceState.isListening && audioData.length > 0 && (
          <div className="flex items-end justify-center space-x-1 h-16 mb-4">
            {audioData.slice(0, 16).map((value, index) => (
              <motion.div
                key={index}
                className="w-2 bg-blue-400 rounded-t"
                animate={{ height: `${Math.max(4, value * 60)}px` }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        )}

        {/* Transcript */}
        <AnimatePresence>
          {voiceState.transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4"
            >
              <p className="text-blue-300 text-sm mb-1">You said:</p>
              <p className="text-white">{voiceState.transcript}</p>
              {voiceState.confidence > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Confidence: {(voiceState.confidence * 100).toFixed(0)}%
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
            >
              <p className="text-purple-300 text-sm mb-1">RAGS says:</p>
              <p className="text-white">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => processCommand("What's the weather?")}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-blue-500/50 transition-colors text-left"
        >
          <Activity className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-white font-medium">Weather</p>
          <p className="text-gray-400 text-sm">Get current weather</p>
        </button>

        <button
          onClick={() => processCommand("Set a reminder")}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-green-500/50 transition-colors text-left"
        >
          <Zap className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-white font-medium">Reminder</p>
          <p className="text-gray-400 text-sm">Set a new reminder</p>
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-white font-medium mb-4">Voice Settings</h3>
            
            <div className="space-y-4">
              {/* Language */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="hi-IN">Hindi (India)</option>
                </select>
              </div>

              {/* Voice Speed */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Voice Speed: {settings.voiceSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.voiceSpeed}
                  onChange={(e) => setSettings(prev => ({ ...prev, voiceSpeed: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Voice Volume */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Voice Volume: {Math.round(settings.voiceVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.voiceVolume}
                  onChange={(e) => setSettings(prev => ({ ...prev, voiceVolume: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Wake Word */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">Wake Word ("Hey RAGS")</label>
                <input
                  type="checkbox"
                  checked={settings.wakeWordEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, wakeWordEnabled: e.target.checked }))}
                  className="rounded"
                />
              </div>

              {/* Continuous Listening */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">Continuous Listening</label>
                <input
                  type="checkbox"
                  checked={settings.continuousListening}
                  onChange={(e) => setSettings(prev => ({ ...prev, continuousListening: e.target.checked }))}
                  className="rounded"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedVoiceAssistant;
