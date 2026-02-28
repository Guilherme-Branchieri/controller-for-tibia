import 'react-native-reanimated';

import * as ScreenOrientation from 'expo-screen-orientation';
import WebSocketService from "@/services/WebSocketService";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";

type Direction =
  | "up" | "down" | "left" | "right"
  | "up-left" | "up-right" | "down-left" | "down-right"
  | "stop";

type Action =
  | "action_runa"
  | "action_antiparalyse"
  | "action_autotarget"
  | "action_autoshooting";

// ── Botões de ação ────────────────────────────────────────────────────────────
const ACTION_BUTTONS: { action: Action; label: string; color: string }[] = [
  { action: "action_runa",         label: "F",    color: "#CC3300" },
  { action: "action_antiparalyse", label: "P",    color: "#0066FF" },
  { action: "action_autotarget",   label: "AT",   color: "#007700" },
  { action: "action_autoshooting", label: "AS",   color: "#885500" },
];

// ── D-pad ─────────────────────────────────────────────────────────────────────
function angleToDirection(angleDeg: number): Direction {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a >= 337.5 || a < 22.5)  return "right";
  if (a >= 22.5  && a < 67.5)  return "up-right";
  if (a >= 67.5  && a < 112.5) return "up";
  if (a >= 112.5 && a < 157.5) return "up-left";
  if (a >= 157.5 && a < 202.5) return "left";
  if (a >= 202.5 && a < 247.5) return "down-left";
  if (a >= 247.5 && a < 292.5) return "down";
  return "down-right";
}

const ARROW: Record<Direction, string> = {
  "up": "↑", "down": "↓", "left": "←", "right": "→",
  "up-left": "↖", "up-right": "↗", "down-left": "↙", "down-right": "↘",
  "stop": "",
};

const SECTOR_ANGLES: Record<Direction, number> = {
  "right": 0, "up-right": 45, "up": 90, "up-left": 135,
  "left": 180, "down-left": 225, "down": 270, "down-right": 315, "stop": 0,
};

const DPAD_SIZE = 240;
const DEAD_ZONE = 28;

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const router = useRouter();
  const lastDirection = useRef<Direction>("stop");
  const [activeDir, setActiveDir]       = useState<Direction | null>(null);
  const [activeAction, setActiveAction] = useState<Action | null>(null);

  const dpadCenter  = useRef<{ x: number; y: number } | null>(null);
  const dpadRef     = useRef<View | null>(null);

  // ── Orientation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (connected) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      ScreenOrientation.unlockAsync();
    }
  }, [connected]);

  // ── WebSocket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = WebSocketService.onConnectionChange(setConnected);
    return unsubscribe;
  }, []);



  // ── Envio de direção (UNCHANGED) ─────────────────────────────────────────────
  const sendDirection = useCallback((dir: Direction) => {
    if (lastDirection.current === dir) return;
    lastDirection.current = dir;
    WebSocketService.send({ type: "move", direction: dir });
  }, []);

  const stop = useCallback(() => {
    setActiveDir(null);
    sendDirection("stop");
  }, [sendDirection]);

  // ── Envio de ação ────────────────────────────────────────────────────────────
  const sendAction = useCallback((action: Action) => {
    WebSocketService.send({ type: "action", action });
    setActiveAction(action);
    setTimeout(() => setActiveAction(null), 150);
  }, []);

  // ── D-pad hit-test ───────────────────────────────────────────────────────────
  const getDirFromTouch = useCallback((pageX: number, pageY: number): Direction | null => {
    const center = dpadCenter.current;
    if (!center) return null;
    const dx   = pageX - center.x;
    const dy   = -(pageY - center.y);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DEAD_ZONE) return null;
    return angleToDirection((Math.atan2(dy, dx) * 180) / Math.PI);
  }, []);

  // ── PanResponder D-pad ───────────────────────────────────────────────────────
  // Verifica se o toque está dentro do círculo do D-pad
  const isTouchInsideDpad = useCallback((pageX: number, pageY: number): boolean => {
    const center = dpadCenter.current;
    if (!center) return false;
    const dx = pageX - center.x;
    const dy = pageY - center.y;
    return Math.sqrt(dx * dx + dy * dy) <= DPAD_SIZE / 2;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      // Só captura se o toque for dentro do círculo do D-pad
      onStartShouldSetPanResponder: (evt) =>
        isTouchInsideDpad(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      // Durante movimento: só mantém se ainda dentro do D-pad
      onMoveShouldSetPanResponder: (evt) =>
        isTouchInsideDpad(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onShouldBlockNativeResponder: () => false,
      onPanResponderGrant: (evt) => {
        const dir = getDirFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (dir) { setActiveDir(dir); sendDirection(dir); }
      },
      onPanResponderMove: (evt) => {
        const dir = getDirFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (dir) { setActiveDir(dir); sendDirection(dir); }
        else     { setActiveDir(null); sendDirection("stop"); }
      },
      onPanResponderRelease:   stop,
      onPanResponderTerminate: stop,
    })
  ).current;

  // ── Captura centro do D-pad ──────────────────────────────────────────────────
  const captureDpadCenter = useCallback((ref: View | null) => {
    dpadRef.current = ref;
  }, []);

  const onDpadLayout = useCallback(() => {
    setTimeout(() => {
      dpadRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
        dpadCenter.current = { x: pageX + width / 2, y: pageY + height / 2 };
      });
    }, 50);
  }, []);

  return (
    <View style={styles.container}>
      {!connected && (
        <Button
          title="Escanear QR para conectar"
          onPress={() => router.push("/scan")}
        />
      )}

      {connected && (
        <View style={styles.gamepad}>

          {/* ── D-PAD ESQUERDO ── */}
          <View style={styles.dpadArea}>
            <View
              ref={captureDpadCenter}
              style={styles.dpad}
              onLayout={onDpadLayout}
              {...panResponder.panHandlers}
            >
              <View style={styles.dpadRing} />
              {[0, 45, 90, 135].map((angle) => (
                <View
                  key={angle}
                  style={[styles.dpadDivider, { transform: [{ rotate: `${angle}deg` }] }]}
                />
              ))}
              {activeDir && activeDir !== "stop" && (
                <View
                  style={[
                    styles.dpadSector,
                    { transform: [{ rotate: `${SECTOR_ANGLES[activeDir]}deg` }] },
                  ]}
                  pointerEvents="none"
                />
              )}
              <View style={styles.dpadCenter}>
                {activeDir && activeDir !== "stop" && (
                  <Text style={styles.dpadArrow}>{ARROW[activeDir]}</Text>
                )}
              </View>
            </View>
          </View>

          {/* ── BOTÕES DE AÇÃO DIREITA ── */}
          <View style={styles.actionsArea}>
            {/* Layout estilo gamepad: 2x2 */}
            <View style={styles.actionsGrid}>
              {ACTION_BUTTONS.map(({ action, label, color }) => (
                <Pressable
                  key={action}
                  style={[
                    styles.actionButton,
                    { borderColor: color },
                    activeAction === action && { backgroundColor: color },
                  ]}
                  onPressIn={() => sendAction(action)}
                >
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: activeAction === action ? "#fff" : color },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

          </View>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    justifyContent: "center",
  },

  gamepad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  // ── D-pad ──────────────────────────────────────────────────────────────────
  dpadArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  dpad: {
    width: DPAD_SIZE,
    height: DPAD_SIZE,
    borderRadius: DPAD_SIZE / 2,
    backgroundColor: "#12121a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },

  dpadRing: {
    position: "absolute",
    width: DPAD_SIZE - 8,
    height: DPAD_SIZE - 8,
    borderRadius: (DPAD_SIZE - 8) / 2,
    borderWidth: 2,
    borderColor: "#1e2040",
  },

  dpadDivider: {
    position: "absolute",
    width: DPAD_SIZE,
    height: 1,
    backgroundColor: "#1e2040",
  },

  dpadCenter: {
    width: DEAD_ZONE * 2,
    height: DEAD_ZONE * 2,
    borderRadius: DEAD_ZONE,
    backgroundColor: "#1a1a28",
    borderWidth: 1.5,
    borderColor: "#2a2a45",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  dpadArrow: {
    color: "#00FF00",
    fontSize: 18,
    fontWeight: "bold",
  },

  dpadSector: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: DPAD_SIZE * 0.18,
    borderRightWidth: DPAD_SIZE * 0.18,
    borderBottomWidth: DPAD_SIZE * 0.48,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(0, 102, 255, 0.35)",
    bottom: "50%",
    marginBottom: DEAD_ZONE,
  },

  // ── Ações ──────────────────────────────────────────────────────────────────
  actionsArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  actionsGrid: {
    width: 196,        // 2 × 90px + 16px gap = 196
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    alignContent: "center",
  },

  actionButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    backgroundColor: "#12121a",
    alignItems: "center",
    justifyContent: "center",
  },

  actionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },

});