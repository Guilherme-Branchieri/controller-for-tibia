import WebSocketService from "@/services/WebSocketService";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, View, ActivityIndicator } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || connecting) return;
    setScanned(true);
    setConnecting(true);

    console.log("QR URL:", data);

    // Só reage ao false depois de ter recebido true pelo menos uma vez
    // Evita loop causado pelo servidor fechando conexão antiga
    let wasConnected = false;

    const unsubscribe = WebSocketService.onConnectionChange((connected) => {
      if (connected) {
        wasConnected = true;
        unsubscribe();
        router.replace("/");
      } else if (wasConnected) {
        // Só reseta se já tinha conectado e caiu — não no false inicial
        unsubscribe();
        setScanned(false);
        setConnecting(false);
      }
    });

    WebSocketService.connect(data);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Precisamos da câmera</Text>
        <Button title="Permitir" onPress={requestPermission} />
      </View>
    );
  }

  if (connecting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={{ marginTop: 12, color: "#fff" }}>Conectando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});