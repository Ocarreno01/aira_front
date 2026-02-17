import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/core/material.module';
import {
  ProjectCatalogOption,
  ProjectsService,
} from '../../services/projects.service';

export interface NewProjectDialogResult {
  created: boolean;
}

@Component({
  selector: 'app-new-project-dialog',
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './new-project-dialog.component.html',
})
export class NewProjectDialogComponent implements OnInit {
  public isLoadingCatalogs = true;
  public isCreatingProject = false;
  public catalogLoadError = '';
  public createError = '';
  public clients: ProjectCatalogOption[] = [];
  public sellers: ProjectCatalogOption[] = [];
  public statuses: ProjectCatalogOption[] = [];
  public projectTypes: ProjectCatalogOption[] = [];

  public readonly newProjectForm = new FormGroup({
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

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly dialogRef: MatDialogRef<
      NewProjectDialogComponent,
      NewProjectDialogResult
    >,
  ) {}

  get f() {
    return this.newProjectForm.controls;
  }

  public ngOnInit(): void {
    void this.loadCatalogs();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public async createProject(): Promise<void> {
    if (this.newProjectForm.invalid) {
      this.newProjectForm.markAllAsTouched();
      return;
    }

    const value = this.newProjectForm.getRawValue();
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

    this.createError = '';
    this.isCreatingProject = true;

    try {
      await this.projectsService.createProject({
        clientId: value.clientId,
        name: projectName,
        sellerId: value.sellerId,
        projectTypeId: value.projectTypeId,
        projectStatusId: value.statusId,
        estimatedValue: value.estimatedValue,
      });

      this.dialogRef.close({
        created: true,
      });
    } catch (error) {
      console.error('Error creating project', error);
      this.createError = 'No fue posible crear el proyecto. Intenta de nuevo.';
    } finally {
      this.isCreatingProject = false;
    }
  }

  public async retryCatalogLoad(): Promise<void> {
    await this.loadCatalogs();
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
    } catch (error) {
      console.error('Error loading project catalogs', error);
      this.catalogLoadError =
        'No fue posible cargar los catálogos del proyecto.';
    } finally {
      this.isLoadingCatalogs = false;
    }
  }
}
