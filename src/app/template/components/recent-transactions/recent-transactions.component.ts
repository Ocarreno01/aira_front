import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MaterialModule } from 'src/app/core/material.module';

interface stats {
  id: number;
  time: string;
  color: string;
  title?: string;
  subtext?: string;
  link?: string;
}

@Component({
  selector: 'app-recent-transactions',
  imports: [NgApexchartsModule, MaterialModule],
  templateUrl: './recent-transactions.component.html',
})
export class AppRecentTransactionsComponent {
  stats: stats[] = [
    {
      id: 1,
      time: '08:45 a. m.',
      color: 'primary',
      subtext: 'Pago recibido de John Doe por $385.90',
    },
    {
      id: 2,
      time: '09:30 a. m.',
      color: 'accent',
      title: 'Nueva venta registrada',
      link: '#ML-3467',
    },
    {
      id: 3,
      time: '10:00 a. m.',
      color: 'success',
      subtext: 'Se realizó un pago de $64.95 a Michael',
    },
    {
      id: 4,
      time: '12:00 p. m.',
      color: 'warning',
      title: 'Nueva venta registrada',
      link: '#ML-3467',
    },
    {
      id: 5,
      time: '03:00 p. m.',
      color: 'error',
      title: 'Nueva llegada registrada',
      link: '#ML-3467',
    },
    {
      id: 6,
      time: '04:45 p. m.',
      color: 'success',
      subtext: 'Pago realizado',
    },
  ];
}
