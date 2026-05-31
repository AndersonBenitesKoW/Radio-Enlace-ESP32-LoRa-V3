import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signal-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-dark flex flex-col" [class.border-l-2]="true"
         [class.border-l-link-excellent]="quality === 'EXCELENTE' || quality === 'BUENA'"
         [class.border-l-link-regular]="quality === 'REGULAR'"
         [class.border-l-link-critical]="quality === 'CRITICA' || quality === 'MARGINAL'">
      <span class="card-header">{{ label }}</span>
      <div class="flex items-baseline gap-1 mt-1">
        <span class="metric-value" [ngClass]="{
          'link-excellent': quality === 'EXCELENTE' || quality === 'BUENA',
          'link-regular': quality === 'REGULAR',
          'link-critical': quality === 'CRITICA' || quality === 'MARGINAL'
        }">{{ value }}</span>
        <span class="metric-unit">{{ unit }}</span>
      </div>
      <div class="mt-2">
        <span class="text-xs px-2 py-0.5 rounded"
              [ngClass]="{
                'badge-excellent': quality === 'EXCELENTE' || quality === 'BUENA',
                'badge-regular': quality === 'REGULAR',
                'badge-marginal': quality === 'MARGINAL',
                'badge-critical': quality === 'CRITICA'
              }">{{ quality || '--' }}</span>
      </div>
    </div>
  `
})
export class SignalCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '--';
  @Input() unit: string = '';
  @Input() quality: string = '';
}
