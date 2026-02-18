import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/core/material.module';
import { NegotiationsService } from '../../services/negotiations.service';

export interface NegotiationLogDialogData {
  negotiationId: string;
  projectName?: string;
}

export interface NegotiationLogDialogResult {
  created: boolean;
}

@Component({
  selector: 'app-negotiation-log-dialog',
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './negotiation-log-dialog.component.html',
})
export class NegotiationLogDialogComponent {
  private readonly negotiationsService = inject(NegotiationsService);
  private readonly dialogRef = inject(
    MatDialogRef<NegotiationLogDialogComponent, NegotiationLogDialogResult>,
  );
  public readonly dialogData = inject<NegotiationLogDialogData>(MAT_DIALOG_DATA);

  public isCreatingLog = false;
  public createLogError = '';

  public readonly logForm = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
  });

  get f() {
    return this.logForm.controls;
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async createLog(): Promise<void> {
    if (this.logForm.invalid) {
      this.logForm.markAllAsTouched();
      return;
    }

    const description = this.logForm.getRawValue().description.trim();
    if (!description) {
      return;
    }

    this.createLogError = '';
    this.isCreatingLog = true;

    try {
      await this.negotiationsService.createNegotiationLog(
        this.dialogData.negotiationId,
        { description },
      );

      this.dialogRef.close({
        created: true,
      });
    } catch (error) {
      console.error('Error creating negotiation log', error);
      this.createLogError =
        'No fue posible crear el registro de bitácora. Intenta de nuevo.';
    } finally {
      this.isCreatingLog = false;
    }
  }
}
