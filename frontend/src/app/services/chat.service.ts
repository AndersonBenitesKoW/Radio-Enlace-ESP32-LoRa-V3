import { Injectable } from '@angular/core';
import { WebSocketService } from './websocket.service';

export interface ChatMessage {
  text: string;
  direction: 'sent' | 'received';
  timestamp: Date;
  rssi?: number;
  snr?: number;
}

const STORAGE_KEY = 'lora_chat_history';
const MAX_STORED_MESSAGES = 200;

@Injectable({ providedIn: 'root' })
export class ChatService {
  messages: ChatMessage[] = [];
  linkStatus = 'Esperando conexion...';

  constructor(private ws: WebSocketService) {
    this.messages = this.loadFromStorage();

    this.ws.messages$.subscribe((msg) => {
      if (msg.type === 'chat') {
        this.messages.push({
          text: msg.data.message,
          direction: 'received',
          timestamp: new Date(),
          rssi: msg.data.rssi,
          snr: msg.data.snr,
        });
        this.linkStatus = `RSSI: ${msg.data.rssi} dBm | SNR: ${msg.data.snr} dB`;
        this.saveToStorage();
      }
    });
  }

  sendMessage(text: string): void {
    this.messages.push({
      text,
      direction: 'sent',
      timestamp: new Date(),
    });
    this.ws.send({ type: 'send_chat', message: text });
    this.saveToStorage();
  }

  private loadFromStorage(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMessage[];
      return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch (e) {
      console.error('[ChatService] Error leyendo historial de localStorage:', e);
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      const toStore = this.messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.error('[ChatService] Error guardando historial en localStorage:', e);
    }
  }
}
