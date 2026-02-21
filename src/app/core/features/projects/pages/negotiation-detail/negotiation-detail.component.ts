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
  private readonly dangerThresholdInDays = 3;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly negotiationsService = inject(NegotiationsService);

  public isLoadingNegotiation = true;
  public negotiationDetailError = '';
  public negotiationId = '';
  public negotiationDetail: NegotiationDetail | null = null;
  private returnRoute: string[] = ['/projects/negotiation-list'];

  public ngOnInit(): void {
    this.negotiationId = this.route.snapshot.paramMap.get('id') ?? '';
    this.resolveReturnRoute();

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
    void this.router.navigate(this.returnRoute);
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

  public shouldShowDangerAlert(): boolean {
    const logs = this.negotiationDetail?.logs ?? [];
    if (!logs.length) {
      return false;
    }

    const logDates = logs
      .map((log) => (log.date ? new Date(log.date).getTime() : Number.NaN))
      .filter((date) => Number.isFinite(date));

    if (!logDates.length) {
      return false;
    }

    const latestLogDate = Math.max(...logDates);
    const elapsedMilliseconds = Date.now() - latestLogDate;
    const thresholdMilliseconds =
      this.dangerThresholdInDays * 24 * 60 * 60 * 1000;

    return elapsedMilliseconds >= thresholdMilliseconds;
  }

  private resolveReturnRoute(): void {
    const from = this.route.snapshot.queryParamMap.get('from');

    if (from === 'project-list') {
      this.returnRoute = ['/projects/project-list'];
      return;
    }

    this.returnRoute = ['/projects/negotiation-list'];
  }
}
