import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<any>();
  private reconnectTimer: any;
  private url = 'ws://localhost:8000/ws';

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] Conectado al backend');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject.next(data);
        } catch (e) {
          console.error('[WS] Error parseando mensaje:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Desconectado. Reintentando en 3s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  get messages$(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  ngOnDestroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
    this.messageSubject.complete();
  }
}
