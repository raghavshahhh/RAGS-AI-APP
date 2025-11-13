import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCamera } from '../hooks/useCamera';

interface CameraScreenProps {
  onClose: () => void;
  onCapture?: (photo: any) => void;
}

export default function CameraScreen({ onClose, onCapture }: CameraScreenProps) {
  const {
    facing,
    toggleCameraFacing,
    takePicture,
    setCameraRef,
    hasPermission,
    requestPermission,
  } = useCamera();
  
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const photo = await takePicture();
    
    if (photo) {
      setCapturedPhoto(photo);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleUse = () => {
    if (capturedPhoto && onCapture) {
      onCapture(capturedPhoto);
    }
    onClose();
  };

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto.uri }} style={styles.preview} />
        
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleRetake} style={styles.controlButton}>
            <Text style={styles.controlText}>🔄 Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleUse} style={styles.controlButton}>
            <LinearGradient
              colors={['#00d9ff', '#7000ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.useButton}
            >
              <Text style={styles.controlText}>✓ Use Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={(ref) => setCameraRef(ref)}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.captureContainer}>
          <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    padding: 16,
    backgroundColor: '#00d9ff',
    borderRadius: 8,
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipText: {
    fontSize: 24,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  preview: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 10,
  },
  useButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  controlText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

