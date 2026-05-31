import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryPacket } from '../../../core/models/telemetry.interface';

@Component({
  selector: 'app-packet-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-dark">
      <span class="card-header">Ultimos Paquetes Recibidos</span>
      <div class="overflow-y-auto max-h-64 mt-2">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-500 text-xs uppercase tracking-wider border-b border-dark-500">
              <th class="text-left py-2 pr-2">ID</th>
              <th class="text-left py-2 pr-2">RSSI</th>
              <th class="text-left py-2 pr-2">SNR</th>
              <th class="text-left py-2 pr-2">Lat.(ms)</th>
              <th class="text-left py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of packets" class="border-b border-dark-500/50 hover:bg-dark-600/30 transition-colors">
              <td class="py-1.5 pr-2 font-mono text-gray-400">{{ p.packet_id }}</td>
              <td class="py-1.5 pr-2 font-mono"
                  [ngClass]="{
                    'link-excellent': p.rssi >= -60,
                    'link-regular': p.rssi >= -100 && p.rssi < -60,
                    'link-critical': p.rssi < -100
                  }">{{ p.rssi }}</td>
              <td class="py-1.5 pr-2 font-mono">{{ p.snr | number:'1.1-1' }}</td>
              <td class="py-1.5 pr-2 font-mono text-gray-400">{{ p.latency_ms | number:'1.0-0' }}</td>
              <td class="py-1.5">
                <span [ngClass]="{
                  'badge-excellent': p.link_quality === 'EXCELENTE',
                  'badge-good': p.link_quality === 'BUENA',
                  'badge-regular': p.link_quality === 'REGULAR',
                  'badge-marginal': p.link_quality === 'MARGINAL',
                  'badge-critical': p.link_quality === 'CRITICA'
                }">{{ p.link_quality }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="packets.length === 0" class="text-gray-600 text-center py-6 text-sm">
          Esperando paquetes...
        </div>
      </div>
    </div>
  `
})
export class PacketTableComponent {
  @Input() packets: TelemetryPacket[] = [];
}
