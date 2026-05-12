// Smart AR Lens - Gyroscope Hook for AR Anchoring
// Tracks device rotation to create spatial persistence illusion

import { useState, useEffect, useRef, useCallback } from 'react';
import { Gyroscope, Accelerometer } from 'expo-sensors';
import {
  GYROSCOPE_UPDATE_INTERVAL,
  ACCELEROMETER_UPDATE_INTERVAL,
} from '../constants/config';

interface GyroscopeData {
  offsetX: number;
  offsetY: number;
  isAvailable: boolean;
  resetAnchoring: () => void;
}

export function useGyroscope(): GyroscopeData {
  const [isAvailable, setIsAvailable] = useState(false);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Use refs for accumulation to avoid stale closure issues
  const gyroSubRef = useRef<any>(null);
  const accelSubRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);

  const resetAnchoring = useCallback(() => {
    offsetXRef.current = 0;
    offsetYRef.current = 0;
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        const gyroAvail = await Gyroscope.isAvailableAsync();
        const accelAvail = await Accelerometer.isAvailableAsync();

        if (!mounted) return;

        if (gyroAvail) {
          setIsAvailable(true);
          Gyroscope.setUpdateInterval(GYROSCOPE_UPDATE_INTERVAL);

          gyroSubRef.current = Gyroscope.addListener((data) => {
            // Accumulate rotation offsets
            // data.y = rotation around Y axis (horizontal panning)
            // data.x = rotation around X axis (vertical tilting)
            offsetXRef.current += data.y * 3; // Scale for visible effect
            offsetYRef.current += data.x * 3;
          });
        }

        if (accelAvail) {
          Accelerometer.setUpdateInterval(ACCELEROMETER_UPDATE_INTERVAL);
          accelSubRef.current = Accelerometer.addListener((_data) => {
            // Accelerometer data can supplement gyroscope for better anchoring
            // Currently using gyroscope as primary rotation source
          });
        }

        // Update state at 30fps (every ~33ms) to avoid excessive re-renders
        const updateState = () => {
          if (!mounted) return;
          setOffset({
            x: offsetXRef.current,
            y: offsetYRef.current,
          });
          frameRef.current = requestAnimationFrame(updateState);
        };
        frameRef.current = requestAnimationFrame(updateState);
      } catch (error) {
        console.warn('Sensor initialization error:', error);
        if (mounted) setIsAvailable(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (gyroSubRef.current) {
        gyroSubRef.current.remove();
      }
      if (accelSubRef.current) {
        accelSubRef.current.remove();
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    offsetX: offset.x,
    offsetY: offset.y,
    isAvailable,
    resetAnchoring,
  };
}
