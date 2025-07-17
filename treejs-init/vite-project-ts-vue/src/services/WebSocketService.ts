import { ref, readonly, type Ref, type Readonly } from 'vue';

export class WebSocketService {
  public readonly isConnected: Readonly<Ref<boolean>>;
  private _isConnected = ref(false);

  private url: string;
  private ws: WebSocket | null = null;
  private onMessageCallback: (data: string) => void;

  constructor(url: string, onMessage: (data: string) => void) {
    this.url = url;
    this.onMessageCallback = onMessage;
    this.isConnected = readonly(this._isConnected);
  }

  public connect = (): void => {
    if (this.ws) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log(`[WS] Connected to ${this.url}`);
      this._isConnected.value = true;
    };

    this.ws.onmessage = (event) => {
      this.onMessageCallback(event.data);
    };

    this.ws.onclose = () => {
      console.log("[WS] Connection closed. Retrying in 5s...");
      this._isConnected.value = false;
      this.ws = null;
      setTimeout(this.connect, 5000);
    };

    this.ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      this._isConnected.value = false;
      this.ws = null;
    };
  };

  public disconnect = (): void => {
    if (this.ws) {
      this.ws.onclose = null; // Prevent auto-reconnect
      this.ws.close();
      this.ws = null;
      this._isConnected.value = false;
      console.log("[WS] Disconnected by user.");
    }
  };

  public send = (data: string | ArrayBufferLike | Blob | ArrayBufferView): void => {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.error("[WS] Cannot send data: WebSocket is not connected.");
    }
  };
}
