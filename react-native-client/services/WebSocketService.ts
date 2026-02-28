type MessageCallback = (data: any) => void;
type StatusCallback = (connected: boolean) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string = "";
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private onMessageCallback?: MessageCallback;
  private statusListeners: Set<StatusCallback> = new Set();

  private shouldReconnect: boolean = false;

  connect(url: string) {
    this.shouldReconnect = true;
    this.url = url;
    this._clearReconnect();
    this._closeSocket();

    console.log("[WS] Iniciando conexão em:", url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("[WS] onopen disparou — conectado!");
      this.statusListeners.forEach((cb) => cb(true));
    };

    this.socket.onclose = (evt) => {
      console.log("[WS] onclose disparou — code:", evt.code, "reason:", evt.reason, "wasClean:", evt.wasClean);
      this.statusListeners.forEach((cb) => cb(false));

      if (this.shouldReconnect) {
        this.reconnectTimeout = setTimeout(() => {
          console.log("[WS] Tentando reconectar...");
          this.connect(this.url);
        }, 2000);
      }
    };

    this.socket.onerror = (error) => {
      console.log("[WS] onerror:", JSON.stringify(error));
    };

    this.socket.onmessage = (event) => {
      this.onMessageCallback?.(event.data);
    };
  }

  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this._clearReconnect();
    this._closeSocket();
  }

  onMessage(callback: MessageCallback) {
    this.onMessageCallback = callback;
  }

  // Adiciona listener — retorna função para remover (usar no cleanup do useEffect)
  onConnectionChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private _clearReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private _closeSocket() {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new WebSocketService();