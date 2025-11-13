import { useState } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export const useCamera = () => {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef) return null;

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      return photo;
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    }
  };

  return {
    facing,
    toggleCameraFacing,
    takePicture,
    setCameraRef,
    hasPermission: permission?.granted,
    requestPermission,
  };
};

