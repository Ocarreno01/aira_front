import { Component, OnInit, inject } from '@angular/core';
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
  private readonly projectsService = inject(ProjectsService);
  private readonly dialogRef = inject(
    MatDialogRef<EditProjectDialogComponent, EditProjectDialogResult>,
  );
  private readonly dialogData = inject<EditProjectDialogData>(MAT_DIALOG_DATA);

  public isLoadingCatalogs = true;
  public isUpdatingProject = false;
  public catalogLoadError = '';
  public updateError = '';
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
    return value.trim().toLowerCase().replaceAll(' ', '_');
  }
}
