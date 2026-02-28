import WebSocketService from "@/services/WebSocketService";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function DirectionalPad() {
  const send = (direction: string) => {
    console.log("Enviando direção:", direction);
    WebSocketService.send({ type: "move", direction });
  };

  const stop = () => {
    WebSocketService.send({ type: "move", direction: "stop" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPressIn={() => send("up")}
          onPressOut={stop}
        >
          <Text style={styles.text}>↑</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPressIn={() => send("left")}
          onPressOut={stop}
        >
          <Text style={styles.text}>←</Text>
        </Pressable>

        <View style={{ width: 80 }} />

        <Pressable
          style={styles.button}
          onPressIn={() => send("right")}
          onPressOut={stop}
        >
          <Text style={styles.text}>→</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPressIn={() => send("down")}
          onPressOut={stop}
        >
          <Text style={styles.text}>↓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    marginVertical: 10,
  },
  button: {
    width: 80,
    height: 80,
    backgroundColor: "#222",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 32,
  },
});