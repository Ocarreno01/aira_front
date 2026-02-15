import { Component } from '@angular/core';
import { MaterialModule } from '../../../../material.module';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-project-list',
  imports: [MaterialModule, CurrencyPipe, TitleCasePipe],
  templateUrl: './project-list.component.html',
})
export class ProjectListComponent {
  public displayedColumnsProjectList: string[] = [
    'client',
    'seller',
    'businessType',
    'stimatedAmount',
    'status',
    'options',
  ];
  public dataSourceProjectList = [
    {
      id: 1,
      clientName: 'Constructora Andina SAS',
      sellerName: 'Carlos Ramírez',
      businessType: 'Venta Corporativa',
      estimatedAmount: 45000000,
      status: 'oportunidad',
    },
    {
      id: 2,
      clientName: 'Transportes del Norte',
      sellerName: 'Laura Gómez',
      businessType: 'Flota Empresarial',
      estimatedAmount: 78000000,
      status: 'cotizacion_enviada',
    },
    {
      id: 3,
      clientName: 'Comercializadora El Sol',
      sellerName: 'Miguel Torres',
      businessType: 'Venta Mayorista',
      estimatedAmount: 125000000,
      status: 'en_negociacion',
    },
    {
      id: 4,
      clientName: 'Industrias Metálicas JR',
      sellerName: 'Andrés López',
      businessType: 'Contrato Marco',
      estimatedAmount: 98000000,
      status: 'vendido',
    },
    {
      id: 5,
      clientName: 'Logística Express Bogotá',
      sellerName: 'Natalia Herrera',
      businessType: 'Renovación de Flota',
      estimatedAmount: 65000000,
      status: 'facturado',
    },
  ];
}
