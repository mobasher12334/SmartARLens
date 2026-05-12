import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

interface SelectionSquareProps {
  box: { x: number; y: number; width: number; height: number };
  onBoxChange: (box: { x: number; y: number; width: number; height: number }) => void;
}

export const SelectionSquare: React.FC<SelectionSquareProps> = ({ box, onBoxChange }) => {
  // Move PanResponder
  const moveResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        onBoxChange({
          ...box,
          x: box.x + gestureState.dx,
          y: box.y + gestureState.dy,
        });
      },
      onPanResponderGrant: () => {},
      onPanResponderRelease: () => {},
    })
  ).current;

  // Resize PanResponder (Corner handle)
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        onBoxChange({
          ...box,
          width: Math.max(50, box.width + gestureState.dx),
          height: Math.max(50, box.height + gestureState.dy),
        });
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.square,
        {
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
        },
      ]}
      {...moveResponder.panHandlers}
    >
      {/* Visual Indicator of handles */}
      <View style={styles.corner} {...resizeResponder.panHandlers} />
      <View style={styles.topLeft} />
      <View style={styles.topRight} />
      <View style={styles.bottomLeft} />
    </View>
  );
};

const styles = StyleSheet.create({
  square: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.selectionBorder,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  corner: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 30,
    height: 30,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 10,
  },
  topLeft: { position: 'absolute', top: -2, left: -2, width: 15, height: 15, borderTopWidth: 4, borderLeftWidth: 4, borderColor: COLORS.primaryGreen },
  topRight: { position: 'absolute', top: -2, right: -2, width: 15, height: 15, borderTopWidth: 4, borderRightWidth: 4, borderColor: COLORS.primaryGreen },
  bottomLeft: { position: 'absolute', bottom: -2, left: -2, width: 15, height: 15, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: COLORS.primaryGreen },
});
