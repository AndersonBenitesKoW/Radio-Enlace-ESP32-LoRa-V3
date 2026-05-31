import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexFill,
  ApexStroke,
} from 'ng-apexcharts';

@Component({
  selector: 'app-signal-gauge',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="card-dark flex flex-col items-center">
      <span class="card-header">Intensidad de Senal</span>
      <apx-chart
        [series]="series"
        [chart]="chart"
        [plotOptions]="plotOptions"
        [fill]="fill"
        [labels]="labels"
        [stroke]="stroke">
      </apx-chart>
      <span class="text-2xl font-mono font-bold mt-0"
            [ngClass]="{
              'link-excellent': value >= 60,
              'link-regular': value >= 30 && value < 60,
              'link-critical': value < 30
            }">{{ value }}%</span>
    </div>
  `
})
export class SignalGaugeComponent implements OnChanges {
  @Input() value: number = 0;

  series: ApexNonAxisChartSeries = [0];
  chart: ApexChart = {
    type: 'radialBar',
    height: 240,
    background: 'transparent',
    foreColor: '#6b7280',
    sparkline: { enabled: true },
  };
  plotOptions: ApexPlotOptions = {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: { margin: 0, size: '65%', background: 'transparent' },
      track: { background: '#151b24', strokeWidth: '97%', margin: 5 },
      dataLabels: { show: false },
    },
  };
  fill: ApexFill = {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: ['#ef4444', '#f59e0b', '#10b981'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 100],
      colorStops: [],
    },
  };
  stroke: ApexStroke = { lineCap: 'round' };
  labels: string[] = ['Senal'];

  ngOnChanges(): void {
    this.series = [this.value];

    let gradientColor: string;
    if (this.value >= 60) gradientColor = '#10b981';
    else if (this.value >= 30) gradientColor = '#f59e0b';
    else gradientColor = '#ef4444';

    this.fill = {
      ...this.fill,
      gradient: {
        ...(this.fill.gradient!),
        colorStops: [
          { offset: 0, color: gradientColor, opacity: 1 },
          { offset: 100, color: gradientColor, opacity: 0.3 },
        ],
      },
    };
  }
}
