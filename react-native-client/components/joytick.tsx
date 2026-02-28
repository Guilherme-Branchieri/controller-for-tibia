import React, { useRef } from "react";
import { View, StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

export type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right"
  | "stop";

interface JoystickProps {
  size?: number;
  knobSize?: number;
  deadzone?: number;
  onDirectionChange?: (direction: Direction) => void;
}

export default function Joystick({
  size = 200,
  knobSize = 70,
  deadzone = 20,
  onDirectionChange,
}: JoystickProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastDirection = useRef<Direction>("stop");

  const radius = size / 2;
  const knobRadius = knobSize / 2;

  const getDirection = (x: number, y: number): Direction => {
    const distance = Math.sqrt(x * x + y * y);
    if (distance < deadzone) return "stop";

    const angle = Math.atan2(y, x) * (180 / Math.PI);

    if (angle >= -22.5 && angle < 22.5) return "right";
    if (angle >= 22.5 && angle < 67.5) return "down-right";
    if (angle >= 67.5 && angle < 112.5) return "down";
    if (angle >= 112.5 && angle < 157.5) return "down-left";
    if (angle >= 157.5 || angle < -157.5) return "left";
    if (angle >= -157.5 && angle < -112.5) return "up-left";
    if (angle >= -112.5 && angle < -67.5) return "up";
    if (angle >= -67.5 && angle < -22.5) return "up-right";

    return "stop";
  };

  const emitDirection = (dir: Direction) => {
    if (dir !== lastDirection.current) {
      lastDirection.current = dir;
      onDirectionChange?.(dir);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const dx = event.translationX;
      const dy = event.translationY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = radius - knobRadius;

      if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        translateX.value = dx * ratio;
        translateY.value = dy * ratio;
      } else {
        translateX.value = dx;
        translateY.value = dy;
      }

      const dir = getDirection(translateX.value, translateY.value);
      runOnJS(emitDirection)(dir);
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      runOnJS(emitDirection)("stop");
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.base,
            { width: size, height: size, borderRadius: radius },
          ]}
        >
          <Animated.View
            style={[
              styles.knob,
              {
                width: knobSize,
                height: knobSize,
                borderRadius: knobRadius,
              },
              animatedStyle,
            ]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  base: {
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  knob: {
    backgroundColor: "#4CAF50",
  },
});