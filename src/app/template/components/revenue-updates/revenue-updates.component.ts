import { Component, ViewChild } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/core/material.module';

interface month {
  value: string;
  viewValue: string;
}

export interface revenueChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  marker: ApexMarkers;
}

@Component({
  selector: 'app-revenue-updates',
  imports: [NgApexchartsModule, MaterialModule, TablerIconsModule],
  templateUrl: './revenue-updates.component.html',
})
export class AppRevenueUpdatesComponent {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);

  public revenueChart!: Partial<revenueChart> | any;

  months: month[] = [
    { value: 'mar', viewValue: 'Año 2026' },
    { value: 'apr', viewValue: 'Año 2025' },
    { value: 'june', viewValue: 'Año 2024' },
  ];

  constructor() {
    this.revenueChart = {
      series: [
        {
          name: 'Ingresos del mes',
          data: [
            1500, 2700, 2200, 3000, 1500, 1000, 1400, 2400, 1900, 2300, 1400,
            1100,
          ],
          color: 'var(--mat-sys-primary)',
        },
        {
          name: 'Gastos del mes',
          data: [
            -1800, -1100, -2500, -1500, -600, -1800, -1200, -2300, -1900, -2300,
            -1200, -2500,
          ],
          color: 'var(--mat-sys-secondary)',
        },
      ],

      chart: {
        type: 'bar',
        fontFamily: 'inherit',
        foreColor: '#adb0bb',
        toolbar: { show: false },
        height: 315,
        stacked: true,
      },

      plotOptions: {
        bar: {
          horizontal: false,
          barHeight: '60%',
          columnWidth: '20%',
          borderRadius: 6,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'all',
        },
      },

      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false },

      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
      },

      yaxis: {
        min: -3000,
        max: 3000,
        tickAmount: 6,
        labels: {
          formatter: (val: number) =>
            new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
            }).format(val),
        },
      },

      xaxis: {
        categories: [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ],
        axisBorder: { show: false },
      },

      tooltip: {
        theme: 'dark',
        y: {
          // Opción 1: consistente con el eje (muestra en miles)
          formatter: (val: number) =>
            new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
            }).format(val),
        },
      },
    };
  }
}
