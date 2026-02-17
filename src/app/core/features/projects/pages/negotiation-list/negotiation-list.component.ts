import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MaterialModule } from 'src/app/core/material.module';
import {
  NegotiationListItem,
  NegotiationsService,
} from '../../services/negotiations.service';

@Component({
  selector: 'app-negotiation-list',
  imports: [MaterialModule, DatePipe],
  templateUrl: './negotiation-list.component.html',
})
export class NegotiationListComponent implements OnInit {
  private readonly negotiationsService = inject(NegotiationsService);

  public isLoadingNegotiations = true;
  public negotiationListError = '';

  public displayedColumnsNegotiationList: string[] = [
    'project',
    'client',
    'createdAt',
    'options',
  ];

  public dataSourceNegotiationList: NegotiationListItem[] = [];

  public ngOnInit(): void {
    void this.loadNegotiations();
  }

  public async loadNegotiations(): Promise<void> {
    this.negotiationListError = '';
    this.isLoadingNegotiations = true;

    try {
      this.dataSourceNegotiationList =
        await this.negotiationsService.getNegotiations();
    } catch (error) {
      console.error('Error loading negotiations', error);
      this.negotiationListError =
        'No fue posible cargar el listado de negociaciones.';
      this.dataSourceNegotiationList = [];
    } finally {
      this.isLoadingNegotiations = false;
    }
  }
}
