import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { TelemetryPacket, SystemState } from '../core/models/telemetry.interface';

@Injectable({ providedIn: 'root' })
export class TelemetryService implements OnDestroy {
  private sub: Subscription;

  private latestPacketSubject = new BehaviorSubject<TelemetryPacket | null>(null);
  private systemStateSubject = new BehaviorSubject<SystemState | null>(null);
  private historySubject = new BehaviorSubject<TelemetryPacket[]>([]);
  private serialStatusSubject = new BehaviorSubject<{event: string; data: any} | null>(null);

  readonly latestPacket$ = this.latestPacketSubject.asObservable();
  readonly systemState$ = this.systemStateSubject.asObservable();
  readonly history$ = this.historySubject.asObservable();
  readonly serialStatus$ = this.serialStatusSubject.asObservable();

  constructor(private ws: WebSocketService) {
    this.sub = this.ws.messages$.subscribe((msg) => {
      if (msg.type === 'init') {
        this.systemStateSubject.next(msg.data as SystemState);
      } else if (msg.type === 'telemetry') {
        const packet = msg.packet as TelemetryPacket;
        this.latestPacketSubject.next(packet);

        const history = this.historySubject.value;
        history.push(packet);
        if (history.length > 100) {
          history.shift();
        }
        this.historySubject.next([...history]);

        if (msg.system) {
          this.systemStateSubject.next(msg.system as SystemState);
        }
      } else if (msg.type === 'heartbeat') {
        if (msg.data) {
          this.systemStateSubject.next({
            ...this.systemStateSubject.value,
            tx_online: true,
            rx_online: true,
          } as SystemState);
        }
      } else if (msg.type === 'serial_status') {
        this.serialStatusSubject.next({ event: msg.event, data: msg.data });
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
