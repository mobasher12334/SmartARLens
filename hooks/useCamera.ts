// Smart AR Lens - Camera Hook
// Manages camera permissions and photo capture

import { useState, useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface CameraHookResult {
  hasPermission: boolean | null;
  cameraRef: React.RefObject<CameraView | null>;
  flashMode: 'off' | 'on';
  toggleFlash: () => void;
  takePicture: () => Promise<string | null>;
  requestPermission: () => Promise<void>;
}

export function useCamera(): CameraHookResult {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView | null>(null);

  const toggleFlash = () => {
    setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  const takePicture = async (): Promise<string | null> => {
    if (!cameraRef.current) {
      console.warn('Camera ref not available');
      return null;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (photo && photo.base64) {
        return photo.base64;
      }
      return null;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return {
    hasPermission: permission?.granted ?? null,
    cameraRef,
    flashMode,
    toggleFlash,
    takePicture,
    requestPermission: handleRequestPermission,
  };
}
