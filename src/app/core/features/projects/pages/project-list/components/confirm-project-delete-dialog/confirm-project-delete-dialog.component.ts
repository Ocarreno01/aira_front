import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/core/material.module';

export interface ConfirmProjectDeleteDialogData {
  projectName: string;
}

@Component({
  selector: 'app-confirm-project-delete-dialog',
  imports: [MaterialModule],
  templateUrl: './confirm-project-delete-dialog.component.html',
})
export class ConfirmProjectDeleteDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ConfirmProjectDeleteDialogComponent, boolean>,
  );
  public readonly dialogData = inject<ConfirmProjectDeleteDialogData>(
    MAT_DIALOG_DATA,
  );

  public close(): void {
    this.dialogRef.close(false);
  }

  public confirmDelete(): void {
    this.dialogRef.close(true);
  }
}
