import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TelemetryService } from '../../../services/telemetry.service';
import { TelemetryPacket, SystemState } from '../../../core/models/telemetry.interface';
import { SignalCardComponent } from '../../components/signal-card/signal-card.component';
import { RssiChartComponent } from '../../components/rssi-chart/rssi-chart.component';
import { SignalGaugeComponent } from '../../components/signal-gauge/signal-gauge.component';
import { PacketTableComponent } from '../../components/packet-table/packet-table.component';
import { NodeStatusComponent } from '../../components/node-status/node-status.component';

interface IndicatorInfo {
  desc: string;
  ranges: Array<{ label: string; quality: string }>;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    SignalCardComponent,
    RssiChartComponent,
    SignalGaugeComponent,
    PacketTableComponent,
    NodeStatusComponent,
  ],
  template: `
    <div class="min-h-screen bg-dark-900">
      <header class="border-b border-dark-500 bg-dark-800/80 backdrop-blur sticky top-0 z-10">
        <div class="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-2 h-2 rounded-full bg-link-excellent shadow-[0_0_8px_#10b981] animate-pulse"></div>
            <div>
              <h1 class="text-lg font-bold tracking-tight text-white">Monitoreo de Radioenlace LoRa</h1>
              <p class="text-xs text-gray-500 font-mono">915 MHz &middot; SX1262 &middot; Heltec WiFi LoRa 32 V3</p>
            </div>
          </div>
          <div class="flex items-center gap-6 text-xs text-gray-500 font-mono">
            <span>Uptime: {{ formatUptime(systemState?.uptime_seconds || 0) }}</span>
            <span class="font-medium"
                  [ngClass]="linkStateClass">{{ linkStateText }}</span>
            <span class="text-link-excellent">{{ wsStatus }}</span>
            <span *ngIf="serialInfo" class="text-yellow-400">{{ serialInfo }}</span>
          </div>
        </div>
      </header>

      <div class="max-w-[1600px] mx-auto px-6 py-6">
        <div class="flex gap-6">

          <!-- ===== SIDEBAR ===== -->
          <aside class="hidden lg:flex flex-col w-72 flex-shrink-0">
            <div class="card-dark sticky top-24 space-y-0">

              <!-- Hero Orb -->
              <div class="flex flex-col items-center py-6 relative overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="hero-ring-1 rounded-full" [ngClass]="heroRingColor"></div>
                  <div class="hero-ring-2 rounded-full" [ngClass]="heroRingColor"></div>
                  <div class="hero-ring-3 rounded-full" [ngClass]="heroRingColor"></div>
                </div>
                <div class="relative w-24 h-24 rounded-full flex flex-col items-center justify-center z-10 transition-all duration-500"
                     [ngClass]="heroCircleClass"
                     [class]="heroGlow">
                  <span class="text-[10px] uppercase tracking-[0.2em] font-semibold"
                        [ngClass]="heroTextClass">{{ heroStateLabel }}</span>
                  <div class="flex items-baseline gap-0.5">
                    <span class="text-2xl font-mono font-bold text-white">{{ heroSignalPct }}</span>
                    <span class="text-xs text-white/60">%</span>
                  </div>
                </div>
                <p class="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-4">Fuerza de Se&#241;al</p>
              </div>

              <!-- Separator -->
              <div class="mx-4 h-px bg-gradient-to-r from-transparent via-dark-500 to-transparent"></div>

              <!-- Indicator Cards -->
              <div class="px-3 py-3 space-y-2">

                <!-- RSSI -->
                <div class="indicator-card" [ngClass]="[glowClass(qualityRSSI), selectedIndicator === 'rssi' ? 'indicator-active' : '']" (click)="toggleIndicator('rssi')">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm">&#x1F4F6;</span>
                      <span class="text-[10px] uppercase tracking-wider font-semibold text-gray-400">RSSI</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(qualityRSSI)">{{ qualityRSSI }}</span>
                      <span class="text-gray-600 transition-transform duration-200" [class.rotate-90]="selectedIndicator === 'rssi'">&#x25B6;</span>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-2xl font-mono font-bold transition-colors duration-500" [ngClass]="valueClass(qualityRSSI)">{{ rssiDisplay }}</span>
                    <span class="text-[10px] text-gray-500 font-mono">dBm</span>
                  </div>
                  <div class="relative mt-1">
                    <div class="h-1 rounded-full bar-spectrum-rssi"></div>
                    <div class="absolute w-0.5 h-2.5 bg-white/90 rounded-sm -translate-x-1/2 -top-[3px] shadow-marker transition-all duration-700"
                         [style.left.%]="rssiBarPct"></div>
                  </div>
                  <div class="flex justify-between text-[8px] text-gray-600 font-mono mt-0.5">
                    <span>-120</span><span>-80</span><span>-40</span><span>0</span>
                  </div>
                  <div *ngIf="selectedIndicator === 'rssi'" class="indicator-detail">
                    <div class="pt-2.5 mt-2.5 border-t border-dark-500/60">
                      <p class="text-[11px] text-gray-400 leading-relaxed mb-2.5">{{ indicatorDescs['rssi'].desc }}</p>
                      <div class="flex flex-wrap gap-1">
                        <span *ngFor="let r of indicatorDescs['rssi'].ranges" class="text-[9px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(r.quality)">{{ r.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SNR -->
                <div class="indicator-card" [ngClass]="[glowClass(qualitySNR), selectedIndicator === 'snr' ? 'indicator-active' : '']" (click)="toggleIndicator('snr')">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm">&#x1F4C8;</span>
                      <span class="text-[10px] uppercase tracking-wider font-semibold text-gray-400">SNR</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(qualitySNR)">{{ qualitySNR }}</span>
                      <span class="text-gray-600 transition-transform duration-200" [class.rotate-90]="selectedIndicator === 'snr'">&#x25B6;</span>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-2xl font-mono font-bold transition-colors duration-500" [ngClass]="valueClass(qualitySNR)">{{ snrDisplay }}</span>
                    <span class="text-[10px] text-gray-500 font-mono">dB</span>
                  </div>
                  <div class="relative mt-1">
                    <div class="h-1 rounded-full bar-spectrum-snr"></div>
                    <div class="absolute w-0.5 h-2.5 bg-white/90 rounded-sm -translate-x-1/2 -top-[3px] shadow-marker transition-all duration-700"
                         [style.left.%]="snrBarPct"></div>
                  </div>
                  <div class="flex justify-between text-[8px] text-gray-600 font-mono mt-0.5">
                    <span>-10</span><span>10</span><span>30</span>
                  </div>
                  <div *ngIf="selectedIndicator === 'snr'" class="indicator-detail">
                    <div class="pt-2.5 mt-2.5 border-t border-dark-500/60">
                      <p class="text-[11px] text-gray-400 leading-relaxed mb-2.5">{{ indicatorDescs['snr'].desc }}</p>
                      <div class="flex flex-wrap gap-1">
                        <span *ngFor="let r of indicatorDescs['snr'].ranges" class="text-[9px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(r.quality)">{{ r.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Packet Loss -->
                <div class="indicator-card" [ngClass]="[glowClass(qualityPacketLoss), selectedIndicator === 'pktloss' ? 'indicator-active' : '']" (click)="toggleIndicator('pktloss')">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm">&#x1F4E6;</span>
                      <span class="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Packet Loss</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(qualityPacketLoss)">{{ qualityPacketLoss }}</span>
                      <span class="text-gray-600 transition-transform duration-200" [class.rotate-90]="selectedIndicator === 'pktloss'">&#x25B6;</span>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-2xl font-mono font-bold transition-colors duration-500" [ngClass]="valueClass(qualityPacketLoss)">{{ packetLossDisplay }}</span>
                    <span class="text-[10px] text-gray-500 font-mono">%</span>
                  </div>
                  <div class="relative mt-1">
                    <div class="h-1 rounded-full bar-spectrum-loss"></div>
                    <div class="absolute w-0.5 h-2.5 bg-white/90 rounded-sm -translate-x-1/2 -top-[3px] shadow-marker transition-all duration-700"
                         [style.left.%]="packetLossBarPct"></div>
                  </div>
                  <div class="flex justify-between text-[8px] text-gray-600 font-mono mt-0.5">
                    <span>0%</span><span>5%</span><span>10%</span><span>100%</span>
                  </div>
                  <div *ngIf="selectedIndicator === 'pktloss'" class="indicator-detail">
                    <div class="pt-2.5 mt-2.5 border-t border-dark-500/60">
                      <p class="text-[11px] text-gray-400 leading-relaxed mb-2.5">{{ indicatorDescs['pktloss'].desc }}</p>
                      <div class="flex flex-wrap gap-1">
                        <span *ngFor="let r of indicatorDescs['pktloss'].ranges" class="text-[9px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(r.quality)">{{ r.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Latencia -->
                <div class="indicator-card" [ngClass]="[glowClass(qualityLatency), selectedIndicator === 'latency' ? 'indicator-active' : '']" (click)="toggleIndicator('latency')">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm">&#x23F1;&#xFE0F;</span>
                      <span class="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Latencia</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(qualityLatency)">{{ qualityLatency }}</span>
                      <span class="text-gray-600 transition-transform duration-200" [class.rotate-90]="selectedIndicator === 'latency'">&#x25B6;</span>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-2xl font-mono font-bold transition-colors duration-500" [ngClass]="valueClass(qualityLatency)">{{ latencyDisplay }}</span>
                    <span class="text-[10px] text-gray-500 font-mono">ms</span>
                  </div>
                  <div class="relative mt-1">
                    <div class="h-1 rounded-full bar-spectrum-latency"></div>
                    <div class="absolute w-0.5 h-2.5 bg-white/90 rounded-sm -translate-x-1/2 -top-[3px] shadow-marker transition-all duration-700"
                         [style.left.%]="latencyBarPct"></div>
                  </div>
                  <div class="flex justify-between text-[8px] text-gray-600 font-mono mt-0.5">
                    <span>0ms</span><span>20ms</span><span>50ms</span><span>100ms</span>
                  </div>
                  <div *ngIf="selectedIndicator === 'latency'" class="indicator-detail">
                    <div class="pt-2.5 mt-2.5 border-t border-dark-500/60">
                      <p class="text-[11px] text-gray-400 leading-relaxed mb-2.5">{{ indicatorDescs['latency'].desc }}</p>
                      <div class="flex flex-wrap gap-1">
                        <span *ngFor="let r of indicatorDescs['latency'].ranges" class="text-[9px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(r.quality)">{{ r.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Se&#241;al % -->
                <div class="indicator-card" [ngClass]="[signalGlowClass, selectedIndicator === 'signal' ? 'indicator-active' : '']" (click)="toggleIndicator('signal')">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm">&#x1F50B;</span>
                      <span class="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Se&#241;al %</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] px-1.5 py-0.5 rounded" [ngClass]="signalBadgeClass">{{ signalQualityLabel }}</span>
                      <span class="text-gray-600 transition-transform duration-200" [class.rotate-90]="selectedIndicator === 'signal'">&#x25B6;</span>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1 mb-2">
                    <span class="text-2xl font-mono font-bold transition-colors duration-500" [ngClass]="signalValueClass">{{ signalPctDisplay }}</span>
                    <span class="text-[10px] text-gray-500 font-mono">%</span>
                  </div>
                  <div class="relative mt-1">
                    <div class="h-1 rounded-full bar-spectrum-signal"></div>
                    <div class="absolute w-0.5 h-2.5 bg-white/90 rounded-sm -translate-x-1/2 -top-[3px] shadow-marker transition-all duration-700"
                         [style.left.%]="signalBarPct"></div>
                  </div>
                  <div class="flex justify-between text-[8px] text-gray-600 font-mono mt-0.5">
                    <span>0%</span><span>30%</span><span>60%</span><span>100%</span>
                  </div>
                  <div *ngIf="selectedIndicator === 'signal'" class="indicator-detail">
                    <div class="pt-2.5 mt-2.5 border-t border-dark-500/60">
                      <p class="text-[11px] text-gray-400 leading-relaxed mb-2.5">{{ indicatorDescs['signal'].desc }}</p>
                      <div class="flex flex-wrap gap-1">
                        <span *ngFor="let r of indicatorDescs['signal'].ranges" class="text-[9px] px-1.5 py-0.5 rounded" [ngClass]="badgeClass(r.quality)">{{ r.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Separator -->
              <div class="mx-4 h-px bg-gradient-to-r from-transparent via-dark-500 to-transparent"></div>

              <!-- Transmission Log -->
              <div *ngIf="rawDataMessage" class="mx-3 my-3 rounded-lg overflow-hidden border transition-all duration-500"
                   [ngClass]="rawDataBorderClass">
                <div class="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-dark-700/60 to-dark-800/40">
                  <div class="relative flex-shrink-0 flex items-center justify-center w-4 h-4">
                    <div class="absolute w-4 h-4 rounded-full opacity-40 animate-ping"
                         [ngClass]="rawDataDotBg"></div>
                    <div class="relative w-2 h-2 rounded-full"
                         [ngClass]="rawDataDotBg"></div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">&#xD8;ltimo Mensaje TX</p>
                    <p class="text-sm font-mono font-medium text-gray-200 truncate">{{ rawDataMessage }}</p>
                  </div>
                  <span class="text-[10px] text-gray-500 font-mono flex-shrink-0">#{{ latestPacket?.packet_id }}</span>
                </div>
              </div>

              <!-- No data placeholder -->
              <div *ngIf="!rawDataMessage" class="mx-3 my-3 rounded-lg border border-dark-500/50 overflow-hidden">
                <div class="flex items-center gap-2.5 px-3 py-2.5">
                  <div class="w-2 h-2 rounded-full bg-gray-600"></div>
                  <p class="text-xs text-gray-600 font-mono">Esperando datos del transmisor...</p>
                </div>
              </div>

            </div>
          </aside>

          <!-- ===== MAIN CONTENT ===== -->
          <div class="flex-1 min-w-0 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <app-signal-card
                label="RSSI"
                [value]="rssiDisplay"
                unit="dBm"
                [quality]="qualityRSSI">
              </app-signal-card>
              <app-signal-card
                label="SNR"
                [value]="snrDisplay"
                unit="dB"
                [quality]="qualitySNR">
              </app-signal-card>
              <app-signal-card
                label="Packet Loss"
                [value]="packetLossDisplay"
                unit="%"
                [quality]="qualityPacketLoss">
              </app-signal-card>
              <app-signal-card
                label="Latencia"
                [value]="latencyDisplay"
                unit="ms"
                [quality]="qualityLatency">
              </app-signal-card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div class="lg:col-span-2">
                <app-rssi-chart [dataPoints]="chartData"></app-rssi-chart>
              </div>
              <div class="space-y-4">
                <app-signal-gauge [value]="latestPacket?.signal_strength_pct ?? 0"></app-signal-gauge>
                <app-node-status
                  [txOnline]="systemState?.tx_online ?? false"
                  [rxOnline]="systemState?.rx_online ?? false"
                  [packetsSent]="systemState?.packets_sent ?? 0"
                  [packetsRx]="systemState?.packets_received ?? 0"
                  [linkState]="systemState?.link_state ?? 'SIN_DATOS'">
                </app-node-status>
              </div>
            </div>

            <div>
              <app-packet-table [packets]="history"></app-packet-table>
            </div>
          </div>
        </div>
      </div>

      <footer class="border-t border-dark-500 bg-dark-800/50 py-3">
        <div class="max-w-[1600px] mx-auto px-6 flex items-center justify-between text-xs text-gray-600 font-mono">
          <span>Sistema de Monitoreo LoRa v1.0</span>
          <span>{{ systemState?.packets_sent ?? 0 }} enviados | {{ systemState?.packets_received ?? 0 }} recibidos | {{ systemState?.packets_lost ?? 0 }} perdidos</span>
        </div>
      </footer>
    </div>
  `,
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  latestPacket: TelemetryPacket | null = null;
  systemState: SystemState | null = null;
  history: TelemetryPacket[] = [];
  chartData: Array<{ x: number; y: number }> = [];
  wsStatus = 'Conectando...';
  serialInfo: string = '';
  selectedIndicator: string | null = null;

  indicatorDescs: Record<string, IndicatorInfo> = {
    rssi: {
      desc: 'Potencia de se\u00f1al recibida del transmisor LoRa. Valores m\u00e1s cercanos a 0 dBm indican mayor fuerza de se\u00f1al. Un RSSI de -50 dBm es excelente, mientras que -115 dBm es el l\u00edmite de recepci\u00f3n.',
      ranges: [
        { label: '\u2265-60 EXCELENTE', quality: 'EXCELENTE' },
        { label: '\u2265-80 BUENA', quality: 'BUENA' },
        { label: '\u2265-100 REGULAR', quality: 'REGULAR' },
        { label: '\u2265-115 MARGINAL', quality: 'MARGINAL' },
        { label: '<-115 CRITICA', quality: 'CRITICA' },
      ],
    },
    snr: {
      desc: 'Relaci\u00f3n se\u00f1al/ruido del enlace LoRa. Valores mayores significan menos interferencia y mejor decodificaci\u00f3n. SNR > 10 dB permite recepci\u00f3n estable incluso a larga distancia.',
      ranges: [
        { label: '\u226510 EXCELENTE', quality: 'EXCELENTE' },
        { label: '\u22655 BUENA', quality: 'BUENA' },
        { label: '\u22650 REGULAR', quality: 'REGULAR' },
        { label: '<0 MARGINAL', quality: 'MARGINAL' },
      ],
    },
    pktloss: {
      desc: 'Porcentaje de paquetes perdidos respecto a los enviados. Se detecta por saltos en los IDs secuenciales de los paquetes. Un 0% indica un enlace perfecto sin p\u00e9rdida de datos.',
      ranges: [
        { label: '\u22642% EXCELENTE', quality: 'EXCELENTE' },
        { label: '\u226410% REGULAR', quality: 'REGULAR' },
        { label: '>10% CRITICA', quality: 'CRITICA' },
      ],
    },
    latency: {
      desc: 'Tiempo de tr\u00e1nsito del paquete desde TX hasta RX, calculado comparando timestamps del transmisor y receptor. Incluye procesamiento en ambos nodos y propagaci\u00f3n LoRa.',
      ranges: [
        { label: '\u226420ms EXCELENTE', quality: 'EXCELENTE' },
        { label: '\u226450ms BUENA', quality: 'BUENA' },
        { label: '>50ms REGULAR', quality: 'REGULAR' },
      ],
    },
    signal: {
      desc: 'Fuerza de se\u00f1al normalizada de 0\u2013100%, mapeada linealmente desde RSSI (-120 a -20 dBm). Facilita la lectura visual r\u00e1pida del estado del enlace sin necesidad de interpretar dBm directamente.',
      ranges: [
        { label: '\u226560% EXCELENTE', quality: 'EXCELENTE' },
        { label: '\u226530% REGULAR', quality: 'REGULAR' },
        { label: '<30% CRITICA', quality: 'CRITICA' },
      ],
    },
  };

  private destroy$ = new Subject<void>();
  private startTime = Date.now();

  constructor(private telemetry: TelemetryService) {}

  toggleIndicator(id: string): void {
    this.selectedIndicator = this.selectedIndicator === id ? null : id;
  }

  get rssiDisplay(): string | number { return this.latestPacket?.rssi ?? '--'; }
  get snrDisplay(): string { return this.latestPacket?.snr != null ? this.latestPacket.snr.toFixed(1) : '--'; }
  get packetLossDisplay(): number { return this.systemState?.packet_loss_pct ?? 0; }
  get latencyDisplay(): string | number { return this.latestPacket?.latency_ms != null ? Math.round(this.latestPacket.latency_ms) : '--'; }

  get qualityRSSI(): string { return this.latestPacket?.link_quality ?? '--'; }
  get qualitySNR(): string {
    const snr = this.latestPacket?.snr;
    if (snr == null) return '--';
    if (snr >= 10) return 'EXCELENTE';
    if (snr >= 5) return 'BUENA';
    if (snr >= 0) return 'REGULAR';
    return 'MARGINAL';
  }
  get qualityPacketLoss(): string {
    const pl = this.systemState?.packet_loss_pct ?? 100;
    if (pl <= 2) return 'EXCELENTE';
    if (pl <= 10) return 'REGULAR';
    return 'CRITICA';
  }
  get qualityLatency(): string {
    const lat = this.latestPacket?.latency_ms ?? 999;
    if (lat <= 20) return 'EXCELENTE';
    if (lat <= 50) return 'BUENA';
    return 'REGULAR';
  }

  get rssiBarPct(): number {
    if (!this.latestPacket) return 0;
    return Math.max(0, Math.min(100, ((this.latestPacket.rssi + 120) / 120) * 100));
  }
  get snrBarPct(): number {
    if (this.latestPacket?.snr == null) return 0;
    return Math.max(0, Math.min(100, ((this.latestPacket.snr + 10) / 40) * 100));
  }
  get packetLossBarPct(): number {
    return Math.max(0, Math.min(100, this.systemState?.packet_loss_pct ?? 0));
  }
  get latencyBarPct(): number {
    if (!this.latestPacket) return 0;
    return Math.max(0, Math.min(100, (this.latestPacket.latency_ms / 100) * 100));
  }
  get signalBarPct(): number {
    return Math.max(0, Math.min(100, this.latestPacket?.signal_strength_pct ?? 0));
  }
  get signalPctDisplay(): string {
    if (this.latestPacket?.signal_strength_pct != null) return Math.round(this.latestPacket.signal_strength_pct).toString();
    return '--';
  }
  get signalQualityLabel(): string {
    const pct = this.latestPacket?.signal_strength_pct ?? 0;
    if (pct >= 60) return 'EXCELENTE';
    if (pct >= 30) return 'REGULAR';
    if (pct > 0) return 'CRITICA';
    return '--';
  }
  get signalGlowClass(): string { return this.glowClass(this.signalQualityLabel); }
  get signalBadgeClass(): string { return this.badgeClass(this.signalQualityLabel); }
  get signalValueClass(): string { return this.valueClass(this.signalQualityLabel); }

  get linkStateText(): string {
    return this.systemState?.link_state
      ? 'Enlace: ' + this.systemState.link_state
      : 'Enlace: SIN_DATOS';
  }
  get linkStateClass(): string {
    const ls = this.systemState?.link_state;
    if (ls === 'EXCELENTE' || ls === 'BUENA') return 'text-link-excellent';
    if (ls === 'REGULAR') return 'text-link-regular';
    return 'text-link-critical';
  }

  get rawDataMessage(): string {
    return this.latestPacket?.raw_data || '';
  }
  get rawDataBorderClass(): string {
    const q = this.qualityRSSI;
    if (q === 'EXCELENTE' || q === 'BUENA') return 'border-link-excellent/40';
    if (q === 'REGULAR') return 'border-link-regular/40';
    return 'border-link-critical/40';
  }
  get rawDataDotBg(): string {
    const q = this.qualityRSSI;
    if (q === 'EXCELENTE' || q === 'BUENA') return 'bg-link-excellent';
    if (q === 'REGULAR') return 'bg-link-regular';
    return 'bg-link-critical';
  }

  get heroStateLabel(): string {
    return this.systemState?.link_state || 'SIN DATOS';
  }
  get heroSignalPct(): string {
    if (this.latestPacket?.signal_strength_pct != null) {
      return Math.round(this.latestPacket.signal_strength_pct).toString();
    }
    return '--';
  }
  get heroCircleClass(): string {
    const ls = this.systemState?.link_state;
    if (ls === 'EXCELENTE' || ls === 'BUENA') return 'border-2 border-link-excellent bg-gradient-to-br from-link-excellent/20 to-dark-800';
    if (ls === 'REGULAR') return 'border-2 border-link-regular bg-gradient-to-br from-link-regular/20 to-dark-800';
    if (ls === 'MARGINAL') return 'border-2 border-link-marginal bg-gradient-to-br from-link-marginal/20 to-dark-800';
    if (ls === 'CRITICA') return 'border-2 border-link-critical bg-gradient-to-br from-link-critical/20 to-dark-800';
    return 'border-2 border-gray-600 bg-gradient-to-br from-gray-600/20 to-dark-800';
  }
  get heroTextClass(): string {
    const ls = this.systemState?.link_state;
    if (ls === 'EXCELENTE' || ls === 'BUENA') return 'text-link-excellent';
    if (ls === 'REGULAR') return 'text-link-regular';
    if (ls === 'MARGINAL') return 'text-link-marginal';
    if (ls === 'CRITICA') return 'text-link-critical';
    return 'text-gray-500';
  }
  get heroGlow(): string {
    const ls = this.systemState?.link_state;
    if (ls === 'EXCELENTE' || ls === 'BUENA') return 'shadow-[0_0_40px_rgba(16,185,129,0.25)]';
    if (ls === 'REGULAR') return 'shadow-[0_0_40px_rgba(245,158,11,0.25)]';
    if (ls === 'MARGINAL') return 'shadow-[0_0_40px_rgba(249,115,22,0.25)]';
    if (ls === 'CRITICA') return 'shadow-[0_0_40px_rgba(239,68,68,0.25)]';
    return 'shadow-[0_0_40px_rgba(100,100,100,0.15)]';
  }
  get heroRingColor(): string {
    const ls = this.systemState?.link_state;
    if (ls === 'EXCELENTE' || ls === 'BUENA') return 'border-link-excellent';
    if (ls === 'REGULAR') return 'border-link-regular';
    if (ls === 'MARGINAL') return 'border-link-marginal';
    if (ls === 'CRITICA') return 'border-link-critical';
    return 'border-gray-600';
  }

  glowClass(quality: string): string {
    switch (quality) {
      case 'EXCELENTE': return 'glow-left-excellent';
      case 'BUENA': return 'glow-left-good';
      case 'REGULAR': return 'glow-left-regular';
      case 'MARGINAL': return 'glow-left-marginal';
      case 'CRITICA': return 'glow-left-critical';
      default: return 'glow-left-default';
    }
  }

  badgeClass(quality: string): string {
    switch (quality) {
      case 'EXCELENTE': return 'bg-link-excellent/20 text-link-excellent border border-link-excellent/30';
      case 'BUENA': return 'bg-link-good/20 text-link-good border border-link-good/30';
      case 'REGULAR': return 'bg-link-regular/20 text-link-regular border border-link-regular/30';
      case 'MARGINAL': return 'bg-link-marginal/20 text-link-marginal border border-link-marginal/30';
      case 'CRITICA': return 'bg-link-critical/20 text-link-critical border border-link-critical/30';
      default: return 'bg-gray-700/50 text-gray-400 border border-gray-600/30';
    }
  }

  valueClass(quality: string): string {
    switch (quality) {
      case 'EXCELENTE': return 'text-link-excellent';
      case 'BUENA': return 'text-link-good';
      case 'REGULAR': return 'text-link-regular';
      case 'MARGINAL': return 'text-link-marginal';
      case 'CRITICA': return 'text-link-critical';
      default: return 'text-gray-400';
    }
  }

  ngOnInit(): void {
    this.telemetry.latestPacket$.pipe(takeUntil(this.destroy$)).subscribe((p) => {
      this.latestPacket = p;
      this.wsStatus = 'LIVE';
      if (p) {
        this.chartData.push({ x: Date.now() - this.startTime, y: p.rssi });
        if (this.chartData.length > 60) {
          this.chartData = this.chartData.slice(-60);
        }
        this.chartData = [...this.chartData];
      }
    });

    this.telemetry.systemState$.pipe(takeUntil(this.destroy$)).subscribe((s) => {
      this.systemState = s;
    });

    this.telemetry.history$.pipe(takeUntil(this.destroy$)).subscribe((h) => {
      this.history = h.slice(-20).reverse();
    });

    this.telemetry.serialStatus$.pipe(takeUntil(this.destroy$)).subscribe((s) => {
      if (!s) return;
      if (s.event === 'serial_error') {
        this.serialInfo = 'Error Serial: ' + (s.data?.message || s.data);
        this.wsStatus = 'SIN SERIAL';
      } else if (s.event === 'serial_connected') {
        const mode = s.data?.simulated ? 'SIMULADO' : 'REAL';
        this.serialInfo = 'Serial: ' + s.data?.port + ' (' + mode + ')';
      } else if (s.event === 'serial_disconnected') {
        this.serialInfo = 'Serial desconectado';
      }
    });

    setTimeout(() => {
      if (!this.latestPacket) {
        this.wsStatus = 'Esperando backend...';
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}