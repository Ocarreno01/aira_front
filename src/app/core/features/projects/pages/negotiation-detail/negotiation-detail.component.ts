import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from 'src/app/core/material.module';
import {
  NegotiationLogDialogComponent,
  NegotiationLogDialogResult,
} from '../negotiation-log-dialog/negotiation-log-dialog.component';
import {
  NegotiationDetail,
  NegotiationsService,
} from '../../services/negotiations.service';

@Component({
  selector: 'app-negotiation-detail',
  imports: [MaterialModule, DatePipe, CurrencyPipe],
  templateUrl: './negotiation-detail.component.html',
})
export class NegotiationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly negotiationsService = inject(NegotiationsService);

  public isLoadingNegotiation = true;
  public negotiationDetailError = '';
  public negotiationId = '';
  public negotiationDetail: NegotiationDetail | null = null;

  public ngOnInit(): void {
    this.negotiationId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.negotiationId) {
      this.negotiationDetailError = 'No se encontró el id de la negociación.';
      this.isLoadingNegotiation = false;
      return;
    }

    void this.loadNegotiationDetail();
  }

  public async loadNegotiationDetail(): Promise<void> {
    if (!this.negotiationId) {
      return;
    }

    this.negotiationDetailError = '';
    this.isLoadingNegotiation = true;

    try {
      this.negotiationDetail = await this.negotiationsService.getNegotiationById(
        this.negotiationId,
      );

      if (!this.negotiationDetail) {
        this.negotiationDetailError =
          'No fue posible encontrar esta negociación.';
      }
    } catch (error) {
      console.error('Error loading negotiation detail', error);
      this.negotiationDetailError =
        'No fue posible cargar el detalle de la negociación.';
      this.negotiationDetail = null;
    } finally {
      this.isLoadingNegotiation = false;
    }
  }

  public goBack(): void {
    void this.router.navigate(['/projects/negotiation-list']);
  }

  public openCreateLogDialog(): void {
    if (!this.negotiationId) {
      return;
    }

    const dialogRef = this.dialog.open(NegotiationLogDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        negotiationId: this.negotiationId,
        projectName: this.negotiationDetail?.projectName,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: NegotiationLogDialogResult | undefined) => {
        if (!result?.created) {
          return;
        }

        void this.loadNegotiationDetail();
      });
  }
}
