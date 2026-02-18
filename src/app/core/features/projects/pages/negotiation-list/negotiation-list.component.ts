import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/core/material.module';
import {
  NegotiationLogDialogComponent,
  NegotiationLogDialogResult,
} from '../negotiation-log-dialog/negotiation-log-dialog.component';
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
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  public isLoadingNegotiations = true;
  public negotiationListError = '';
  public searchNegotiationTerm = '';

  public displayedColumnsNegotiationList: string[] = [
    'project',
    'client',
    'createdAt',
    'options',
  ];

  public dataSourceNegotiationList: NegotiationListItem[] = [];
  public filteredDataSourceNegotiationList: NegotiationListItem[] = [];

  public ngOnInit(): void {
    void this.loadNegotiations();
  }

  public async loadNegotiations(): Promise<void> {
    this.negotiationListError = '';
    this.isLoadingNegotiations = true;

    try {
      this.dataSourceNegotiationList =
        await this.negotiationsService.getNegotiations();
      this.applySearchFilter(this.searchNegotiationTerm);
    } catch (error) {
      console.error('Error loading negotiations', error);
      this.negotiationListError =
        'No fue posible cargar el listado de negociaciones.';
      this.dataSourceNegotiationList = [];
      this.filteredDataSourceNegotiationList = [];
    } finally {
      this.isLoadingNegotiations = false;
    }
  }

  public openNegotiationDetail(negotiationId: string): void {
    if (!negotiationId) {
      return;
    }

    void this.router.navigate(['/projects/negotiation-list', negotiationId]);
  }

  public openCreateLogDialog(negotiation: NegotiationListItem): void {
    if (!negotiation.id) {
      return;
    }

    const dialogRef = this.dialog.open(NegotiationLogDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        negotiationId: negotiation.id,
        projectName: negotiation.projectName,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: NegotiationLogDialogResult | undefined) => {
        if (!result?.created) {
          return;
        }

        void this.loadNegotiations();
      });
  }

  public applySearchFilter(value: string): void {
    this.searchNegotiationTerm = value;
    const normalizedTerm = this.normalizeSearchText(value);

    if (!normalizedTerm) {
      this.filteredDataSourceNegotiationList = [
        ...this.dataSourceNegotiationList,
      ];
      return;
    }

    this.filteredDataSourceNegotiationList = this.dataSourceNegotiationList.filter(
      (negotiation) =>
        this.buildNegotiationSearchIndex(negotiation).includes(normalizedTerm),
    );
  }

  public clearSearch(): void {
    this.applySearchFilter('');
  }

  private buildNegotiationSearchIndex(negotiation: NegotiationListItem): string {
    return this.normalizeSearchText(
      [
        negotiation.id,
        negotiation.projectName,
        negotiation.clientName,
        negotiation.createdAt,
      ].join(' '),
    );
  }

  private normalizeSearchText(value: unknown): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
