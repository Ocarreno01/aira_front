import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/core/material.module';
import {
  ProjectCatalogOption,
  ProjectListItem,
  ProjectsService,
} from '../../../../services/projects.service';
import { NegotiationsService } from '../../../../services/negotiations.service';

export interface EditProjectDialogData {
  project: ProjectListItem;
}

export interface EditProjectDialogResult {
  updated: boolean;
}

@Component({
  selector: 'app-edit-project-dialog',
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './edit-project-dialog.component.html',
})
export class EditProjectDialogComponent implements OnInit {
  private readonly defaultNegotiationStatusCode = 'en_negociacion';

  private readonly projectsService = inject(ProjectsService);
  private readonly negotiationsService = inject(NegotiationsService);
  private readonly dialogRef = inject(
    MatDialogRef<EditProjectDialogComponent, EditProjectDialogResult>,
  );
  private readonly dialogData = inject<EditProjectDialogData>(MAT_DIALOG_DATA);

  public isLoadingCatalogs = true;
  public isUpdatingProject = false;
  public catalogLoadError = '';
  public updateError = '';
  public statusWithBitacoraCode = this.defaultNegotiationStatusCode;
  public clients: ProjectCatalogOption[] = [];
  public sellers: ProjectCatalogOption[] = [];
  public statuses: ProjectCatalogOption[] = [];
  public projectTypes: ProjectCatalogOption[] = [];

  public readonly editProjectForm = new FormGroup({
    projectName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    clientId: new FormControl<string | number | null>(null, {
      validators: [Validators.required],
    }),
    sellerId: new FormControl<string | number | null>(null, {
      validators: [Validators.required],
    }),
    projectTypeId: new FormControl<string | number | null>(null, {
      validators: [Validators.required],
    }),
    statusId: new FormControl<string | number | null>(null, {
      validators: [Validators.required],
    }),
    negotiationDescription: new FormControl('', {
      nonNullable: true,
    }),
    estimatedValue: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  constructor() {
    const project = this.dialogData.project;
    this.editProjectForm.patchValue({
      projectName: project.name,
      estimatedValue: project.estimatedValue,
      clientId: project.clientId,
      sellerId: project.sellerId,
      projectTypeId: project.projectTypeId,
      statusId: project.projectStatusId,
    });
  }

  get f() {
    return this.editProjectForm.controls;
  }

  public ngOnInit(): void {
    this.f.statusId.valueChanges.subscribe(() => {
      this.updateNegotiationValidators();
    });

    void this.loadStatusWithBitacora();
    void this.loadCatalogs();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async retryCatalogLoad(): Promise<void> {
    await this.loadCatalogs();
  }

  public async updateProject(): Promise<void> {
    if (this.editProjectForm.invalid) {
      this.editProjectForm.markAllAsTouched();
      return;
    }

    const value = this.editProjectForm.getRawValue();
    const projectName = value.projectName.trim();
    const shouldCreateNegotiation = this.shouldShowNegotiationForm();
    const negotiationDescription = value.negotiationDescription.trim();

    if (
      !projectName ||
      value.clientId === null ||
      value.sellerId === null ||
      value.projectTypeId === null ||
      value.statusId === null ||
      value.estimatedValue === null
    ) {
      return;
    }

    if (shouldCreateNegotiation && !negotiationDescription) {
      this.f.negotiationDescription.markAsTouched();
      this.updateNegotiationValidators();
      return;
    }

    this.updateError = '';
    this.isUpdatingProject = true;

    try {
      await this.projectsService.updateProject(this.dialogData.project.id, {
        name: projectName,
        clientId: value.clientId,
        sellerId: value.sellerId,
        projectTypeId: value.projectTypeId,
        projectStatusId: value.statusId,
        estimatedValue: value.estimatedValue,
      });

      if (shouldCreateNegotiation) {
        await this.createNegotiationForProject(
          this.dialogData.project.id,
          value.clientId,
          value.sellerId,
          negotiationDescription,
        );
      }

      this.dialogRef.close({
        updated: true,
      });
    } catch (error) {
      console.error('Error updating project', error);
      this.updateError =
        'No fue posible actualizar el proyecto. Intenta de nuevo.';
    } finally {
      this.isUpdatingProject = false;
    }
  }

  private async loadCatalogs(): Promise<void> {
    this.catalogLoadError = '';
    this.isLoadingCatalogs = true;

    try {
      const [clients, sellers, statuses, projectTypes] = await Promise.all([
        this.projectsService.getClients(),
        this.projectsService.getSellers(),
        this.projectsService.getStatuses(),
        this.projectsService.getProjectTypes(),
      ]);

      this.clients = clients;
      this.sellers = sellers;
      this.statuses = statuses;
      this.projectTypes = projectTypes;

      this.resolveMissingSelectionsFromNames();
      this.updateNegotiationValidators();
    } catch (error) {
      console.error('Error loading project catalogs', error);
      this.catalogLoadError =
        'No fue posible cargar los catálogos del proyecto.';
    } finally {
      this.isLoadingCatalogs = false;
    }
  }

  private resolveMissingSelectionsFromNames(): void {
    const project = this.dialogData.project;

    if (this.f.clientId.value === null) {
      this.f.clientId.setValue(
        this.findOptionIdByName(this.clients, project.clientName),
      );
    }

    if (this.f.sellerId.value === null) {
      this.f.sellerId.setValue(
        this.findOptionIdByName(this.sellers, project.sellerName),
      );
    }

    if (this.f.projectTypeId.value === null) {
      this.f.projectTypeId.setValue(
        this.findOptionIdByName(this.projectTypes, project.businessTypeName),
      );
    }

    if (this.f.statusId.value === null) {
      const statusByCode = this.statuses.find(
        (status) =>
          this.normalizeText(String(status.id)) ===
            this.normalizeText(project.statusCode) ||
          this.normalizeText(status.name) === this.normalizeText(project.statusCode),
      );

      this.f.statusId.setValue(
        statusByCode?.id ??
          this.findOptionIdByName(this.statuses, project.statusName),
      );
    }
  }

  private findOptionIdByName(
    options: ProjectCatalogOption[],
    expectedName: string,
  ): string | number | null {
    const match = options.find(
      (option) =>
        this.normalizeText(option.name) === this.normalizeText(expectedName),
    );

    return match?.id ?? null;
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replaceAll('-', '_')
      .replaceAll(' ', '_');
  }

  public shouldShowNegotiationForm(): boolean {
    return (
      this.isNegotiationStatusSelected() && !this.startedWithNegotiationStatus()
    );
  }

  public isNegotiationStatusSelected(): boolean {
    const selectedStatusId = this.f.statusId.value;
    if (selectedStatusId === null) {
      return false;
    }

    const selectedStatus = this.statuses.find(
      (status) => String(status.id) === String(selectedStatusId),
    );
    const statusCode = this.normalizeText(
      selectedStatus?.code ?? selectedStatus?.name ?? String(selectedStatusId),
    );

    return statusCode === this.statusWithBitacoraCode;
  }

  private updateNegotiationValidators(): void {
    const descriptionControl = this.f.negotiationDescription;

    if (this.shouldShowNegotiationForm()) {
      descriptionControl.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      descriptionControl.clearValidators();
      descriptionControl.setValue('', { emitEvent: false });
    }

    descriptionControl.updateValueAndValidity({ emitEvent: false });
  }

  private async createNegotiationForProject(
    projectId: string | number,
    clientId: string | number,
    sellerId: string | number,
    description: string,
  ): Promise<void> {
    try {
      await this.negotiationsService.createNegotiation({
        projectId,
        clientId,
        sellerId,
        description,
      });
    } catch (error) {
      if (this.isConflictError(error)) {
        return;
      }

      throw error;
    }
  }

  private isConflictError(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 409;
    }

    return false;
  }

  private startedWithNegotiationStatus(): boolean {
    return (
      this.normalizeText(this.dialogData.project.statusCode) ===
      this.statusWithBitacoraCode
    );
  }

  private async loadStatusWithBitacora(): Promise<void> {
    try {
      const statusWithBitacora =
        await this.projectsService.getStatusWithBitacora();

      if (!statusWithBitacora) {
        return;
      }

      this.statusWithBitacoraCode = this.normalizeText(
        statusWithBitacora.code ?? statusWithBitacora.name,
      );
      this.updateNegotiationValidators();
    } catch (error) {
      console.error('Error loading statusWithBitacora', error);
      this.statusWithBitacoraCode = this.defaultNegotiationStatusCode;
    }
  }
}
