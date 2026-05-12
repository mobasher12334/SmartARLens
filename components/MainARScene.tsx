import React from 'react';
import { StyleSheet } from 'react-native';
import {
  ViroARScene,
  ViroText,
  ViroBox,
} from '@reactvision/react-viro';

// Safe Mode Diagnostic Scene
export const MainARScene = () => {
  return (
    <ViroARScene>
      {/* 
        A very simple box placed 1 meter in front of the camera.
        If this crashes, ARCore or ViroReact itself is fundamentally broken on this device.
      */}
      <ViroBox
        position={[0, 0, -1]}
        scale={[0.2, 0.2, 0.2]}
        materials={["diagnosticMaterial"]}
      />
      <ViroText
        text="Test AR Box"
        position={[0, 0.2, -1]}
        style={{
          fontFamily: 'Arial',
          fontSize: 20,
          color: '#ffffff',
          textAlignVertical: 'center',
          textAlign: 'center',
        } as any}
      />
    </ViroARScene>
  );
};

// @ts-ignore
import { ViroMaterials } from '@reactvision/react-viro';
ViroMaterials.createMaterials({
  diagnosticMaterial: {
    diffuseColor: "#ff0000",
  },
});
