import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexFill,
  ApexGrid,
  ApexMarkers,
  ApexTooltip,
  ApexAnnotations,
} from 'ng-apexcharts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rssi-chart',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule],
  template: `
    <div class="card-dark">
      <span class="card-header">RSSI en Tiempo Real (dBm)</span>
      <apx-chart
        *ngIf="series.length"
        [series]="series"
        [chart]="chart"
        [xaxis]="xaxis"
        [yaxis]="yaxis"
        [stroke]="stroke"
        [fill]="fill"
        [grid]="grid"
        [markers]="markers"
        [tooltip]="tooltip"
        [annotations]="annotations">
      </apx-chart>
    </div>
  `
})
export class RssiChartComponent implements OnChanges {
  @Input() dataPoints: Array<{ x: number; y: number }> = [];

  series: ApexAxisChartSeries = [{ name: 'RSSI', data: [], color: '#22d3ee' }];
  chart: ApexChart = {
    type: 'area',
    height: 300,
    background: 'transparent',
    animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 350 } },
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#6b7280',
  };
  xaxis: ApexXAxis = {
    type: 'numeric',
    labels: { style: { colors: ['#6b7280'] } },
    axisBorder: { color: '#1c2333' },
    axisTicks: { color: '#1c2333' },
  };
  yaxis: ApexYAxis = {
    title: { text: 'dBm', style: { color: '#6b7280' } },
    labels: { style: { colors: ['#6b7280'] } },
    min: -130,
    max: -20,
  };
  stroke: ApexStroke = { curve: 'smooth', width: 2 };
  fill: ApexFill = {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'vertical',
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 100],
    },
  };
  grid: ApexGrid = { borderColor: '#1c2333', strokeDashArray: 4 };
  markers: ApexMarkers = { size: 0 };
  tooltip: ApexTooltip = {
    theme: 'dark',
    x: { formatter: (val: number) => `T +${(val / 1000).toFixed(1)}s` },
  };
  annotations: ApexAnnotations = {
    yaxis: [
      { y: -60, borderColor: '#10b981', opacity: 0.3, label: { text: 'Excelente', style: { color: '#10b981' } } },
      { y: -80, borderColor: '#f59e0b', opacity: 0.3, label: { text: 'Regular', style: { color: '#f59e0b' } } },
      { y: -100, borderColor: '#f97316', opacity: 0.3, label: { text: 'Marginal', style: { color: '#f97316' } } },
      { y: -115, borderColor: '#ef4444', opacity: 0.3, label: { text: 'Critica', style: { color: '#ef4444' } } },
    ],
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataPoints'] && this.dataPoints.length > 0) {
      const data = [...this.dataPoints];
      if (data.length > 60) {
        data.splice(0, data.length - 60);
      }
      this.series = [{ name: 'RSSI', data, color: '#22d3ee' }];
    }
  }
}
