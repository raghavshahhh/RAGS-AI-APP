import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { voiceAPI } from '../services/api';

export const useVoiceRecording = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }, []);

  const startRecording = async () => {
    try {
      // Request permission if not granted
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return null;

    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    setRecording(null);
    console.log('Recording stopped and stored at', uri);
    return uri;
  };

  const sendAudioToBackend = async (uri: string | null) => {
    if (!uri) return null;

    try {
      setIsProcessing(true);
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to backend
      const response = await voiceAPI.sendAudio(uri);
      
      setIsProcessing(false);
      return response.data;
    } catch (error) {
      console.error('Failed to send audio:', error);
      setIsProcessing(false);
      return null;
    }
  };

  const recordAndProcess = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      const result = await sendAudioToBackend(uri);
      return result;
    } else {
      await startRecording();
      return null;
    }
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    sendAudioToBackend,
    recordAndProcess,
    hasPermission: permissionResponse?.status === 'granted',
  };
};

