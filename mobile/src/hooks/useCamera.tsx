// ============================================================================
// Enhanced Camera Hook with Permissions and Capture
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';

export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);

  // Request camera permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  // Check permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Toggle camera facing
  const toggleCameraFacing = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing(current => 
      current === 'back' ? 'front' : 'back'
    );
  };

  // Take picture
  const takePicture = async () => {
    if (!cameraRef.current) {
      console.warn('Camera ref not set');
      return null;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });
      if (photo?.uri) {
        console.log('📷 Photo captured:', photo.uri);
        return photo;
      }
      return null;
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    }
  };

  // Set camera ref
  const setCameraRef = (ref: CameraView | null) => {
    cameraRef.current = ref;
  };

  return {
    hasPermission,
    requestPermission,
    facing,
    toggleCameraFacing,
    takePicture,
    setCameraRef,
  };
}
