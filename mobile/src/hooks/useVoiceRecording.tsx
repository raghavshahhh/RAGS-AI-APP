// ============================================================================
// Enhanced Voice Recording Hook with Error Handling
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

interface VoiceRecordingResult {
  success: boolean;
  response?: string;
  error?: string;
}

export function useVoiceRecording() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Request audio permissions
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status === 'granted') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } catch (error) {
        console.error('Failed to get audio permission:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  /**
   * Start recording
   */
  const startRecording = async (): Promise<boolean> => {
    if (!hasPermission) {
      console.warn('No audio permission');
      return false;
    }

    try {
      console.log('🎤 Starting recording...');
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      
      console.log('✅ Recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      return false;
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = async (): Promise<string | null> => {
    if (!recordingRef.current) {
      console.warn('No active recording');
      return null;
    }

    try {
      console.log('⏹️ Stopping recording...');
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      recordingRef.current = null;
      setIsRecording(false);
      
      console.log('✅ Recording stopped:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      return null;
    }
  };

  /**
   * Process audio file
   */
  const processAudio = async (audioUri: string): Promise<VoiceRecordingResult> => {
    try {
      console.log('🧠 Processing audio...');
      setIsProcessing(true);

      // Read audio file
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to backend for processing
      const response = await axios.post(
        'http://localhost:3000/api/real-ai/chat',
        {
          message: 'Voice input', // Placeholder - backend should handle audio
          audioData: audioData,
        },
        {
          timeout: 30000,
        }
      );

      setIsProcessing(false);

      if (response.data.success) {
        return {
          success: true,
          response: response.data.response?.text || 'No response',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Processing failed',
        };
      }
    } catch (error: any) {
      console.error('Audio processing error:', error);
      setIsProcessing(false);
      
      return {
        success: false,
        error: error.message || 'Failed to process audio',
      };
    } finally {
      // Clean up audio file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete audio file:', error);
      }
    }
  };

  /**
   * Record and process in one go
   */
  const recordAndProcess = async (): Promise<VoiceRecordingResult> => {
    if (isRecording) {
      // Stop current recording and process
      const uri = await stopRecording();
      if (uri) {
        return processAudio(uri);
      }
      return { success: false, error: 'Failed to get recording' };
    } else {
      // Start new recording
      const started = await startRecording();
      if (!started) {
        return { success: false, error: 'Failed to start recording' };
      }
      
      // Auto-stop after 5 seconds
      setTimeout(async () => {
        if (isRecording) {
          const uri = await stopRecording();
          if (uri) {
            await processAudio(uri);
          }
        }
      }, 5000);
      
      return { success: true };
    }
  };

  /**
   * Cancel recording
   */
  const cancelRecording = async (): Promise<void> => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
        setIsRecording(false);
        console.log('🚫 Recording cancelled');
      } catch (error) {
        console.error('Failed to cancel recording:', error);
      }
    }
  };

  return {
    hasPermission,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    processAudio,
    recordAndProcess,
    cancelRecording,
  };
}
