import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-node-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-dark">
      <span class="card-header">Estado de Nodos</span>
      <div class="flex items-center justify-around mt-3">
        <!-- Transmisor -->
        <div class="flex flex-col items-center gap-2">
          <div class="relative w-14 h-14 flex items-center justify-center">
            <div class="absolute w-14 h-14 rounded-full"
                 [class.bg-link-excellent/20]="txOnline"
                 [class.bg-link-critical/20]="!txOnline">
            </div>
            <div class="absolute w-10 h-10 rounded-full"
                 [class.animate-ping]="txOnline"
                 [class.bg-link-excellent/40]="txOnline"
                 [class.bg-link-critical/40]="!txOnline">
            </div>
            <div class="relative w-5 h-5 rounded-full"
                 [class.bg-link-excellent]="txOnline"
                 [class.bg-link-critical]="!txOnline"
                 [class.shadow-lg]="txOnline"
                 [ngStyle]="{'box-shadow': txOnline ? '0 0 12px #10b981' : '0 0 6px #ef4444'}">
            </div>
          </div>
          <span class="text-sm font-medium text-gray-300">TX</span>
          <span class="text-xs" [class.text-link-excellent]="txOnline" [class.text-link-critical]="!txOnline">
            {{ txOnline ? 'ONLINE' : 'OFFLINE' }}
          </span>
          <span class="text-xs text-gray-600 font-mono">{{ packetsSent }} pkts</span>
        </div>

        <!-- Enlace -->
        <div class="flex flex-col items-center gap-1">
          <span class="text-xl font-mono font-bold"
                [ngClass]="{
                  'link-excellent': linkState === 'EXCELENTE' || linkState === 'BUENA',
                  'link-regular': linkState === 'REGULAR',
                  'link-critical': linkState === 'MARGINAL' || linkState === 'CRITICA'
                }">&harr;</span>
          <span class="text-[10px] uppercase tracking-widest text-gray-600">Enlace</span>
        </div>

        <!-- Receptor -->
        <div class="flex flex-col items-center gap-2">
          <div class="relative w-14 h-14 flex items-center justify-center">
            <div class="absolute w-14 h-14 rounded-full"
                 [class.bg-link-excellent/20]="rxOnline"
                 [class.bg-link-critical/20]="!rxOnline">
            </div>
            <div class="absolute w-10 h-10 rounded-full"
                 [class.animate-ping]="rxOnline"
                 [class.bg-link-excellent/40]="rxOnline"
                 [class.bg-link-critical/40]="!rxOnline">
            </div>
            <div class="relative w-5 h-5 rounded-full"
                 [class.bg-link-excellent]="rxOnline"
                 [class.bg-link-critical]="!rxOnline"
                 [class.shadow-lg]="rxOnline"
                 [ngStyle]="{'box-shadow': rxOnline ? '0 0 12px #10b981' : '0 0 6px #ef4444'}">
            </div>
          </div>
          <span class="text-sm font-medium text-gray-300">RX</span>
          <span class="text-xs" [class.text-link-excellent]="rxOnline" [class.text-link-critical]="!rxOnline">
            {{ rxOnline ? 'ONLINE' : 'OFFLINE' }}
          </span>
          <span class="text-xs text-gray-600 font-mono">{{ packetsRx }} pkts</span>
        </div>
      </div>
    </div>
  `
})
export class NodeStatusComponent {
  @Input() txOnline: boolean = false;
  @Input() rxOnline: boolean = false;
  @Input() packetsSent: number = 0;
  @Input() packetsRx: number = 0;
  @Input() linkState: string = 'SIN_DATOS';
}
