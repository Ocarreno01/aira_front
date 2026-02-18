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
import { NegotiationsService } from '../../services/negotiations.service';

export interface NewProjectDialogResult {
  created: boolean;
}

@Component({
  selector: 'app-new-project-dialog',
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './new-project-dialog.component.html',
})
export class NewProjectDialogComponent implements OnInit {
  private readonly defaultNegotiationStatusCode = 'en_negociacion';

  public isLoadingCatalogs = true;
  public isCreatingProject = false;
  public catalogLoadError = '';
  public createError = '';
  public statusWithBitacoraCode = this.defaultNegotiationStatusCode;
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
    negotiationDescription: new FormControl('', {
      nonNullable: true,
    }),
    estimatedValue: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly negotiationsService: NegotiationsService,
    private readonly dialogRef: MatDialogRef<
      NewProjectDialogComponent,
      NewProjectDialogResult
    >,
  ) {}

  get f() {
    return this.newProjectForm.controls;
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

  public async createProject(): Promise<void> {
    if (this.newProjectForm.invalid) {
      this.newProjectForm.markAllAsTouched();
      return;
    }

    const value = this.newProjectForm.getRawValue();
    const projectName = value.projectName.trim();
    const negotiationDescription = value.negotiationDescription.trim();
    const shouldCreateNegotiation = this.isNegotiationStatusSelected();

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

    this.createError = '';
    this.isCreatingProject = true;

    try {
      let projectId = await this.projectsService.createProject({
        clientId: value.clientId,
        name: projectName,
        sellerId: value.sellerId,
        projectTypeId: value.projectTypeId,
        projectStatusId: value.statusId,
        estimatedValue: value.estimatedValue,
      });

      if (shouldCreateNegotiation && projectId === null) {
        projectId = await this.resolveCreatedProjectId(
          projectName,
          value.clientId,
          value.sellerId,
        );
      }

      if (shouldCreateNegotiation && projectId !== null) {
        await this.createNegotiationForProject(
          projectId,
          value.clientId,
          value.sellerId,
          negotiationDescription,
        );
      }

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
      this.updateNegotiationValidators();
    } catch (error) {
      console.error('Error loading project catalogs', error);
      this.catalogLoadError =
        'No fue posible cargar los catálogos del proyecto.';
    } finally {
      this.isLoadingCatalogs = false;
    }
  }

  public isNegotiationStatusSelected(): boolean {
    const selectedStatusId = this.f.statusId.value;
    if (selectedStatusId === null) {
      return false;
    }

    const selectedStatus = this.statuses.find(
      (status) => String(status.id) === String(selectedStatusId),
    );
    const statusCode = this.normalizeStatusCode(
      selectedStatus?.code ?? selectedStatus?.name ?? String(selectedStatusId),
    );
    console.log('this.statusWithBitacoraCode;', this.statusWithBitacoraCode);
    return statusCode === this.statusWithBitacoraCode;
  }

  private updateNegotiationValidators(): void {
    const descriptionControl = this.f.negotiationDescription;

    if (this.isNegotiationStatusSelected()) {
      descriptionControl.setValidators([
        Validators.required,
        Validators.minLength(5),
      ]);
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
    await this.negotiationsService.createNegotiation({
      projectId,
      clientId,
      sellerId,
      description,
    });
  }

  private normalizeStatusCode(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replaceAll('-', '_')
      .replaceAll(' ', '_');
  }

  private async loadStatusWithBitacora(): Promise<void> {
    try {
      const statusWithBitacora =
        await this.projectsService.getStatusWithBitacora();

      if (!statusWithBitacora) {
        return;
      }

      this.statusWithBitacoraCode = this.normalizeStatusCode(
        statusWithBitacora.code ?? statusWithBitacora.name,
      );
      this.updateNegotiationValidators();
    } catch (error) {
      console.error('Error loading statusWithBitacora', error);
      this.statusWithBitacoraCode = this.defaultNegotiationStatusCode;
    }
  }

  private async resolveCreatedProjectId(
    projectName: string,
    clientId: string | number,
    sellerId: string | number,
  ): Promise<string | number | null> {
    const projects = await this.projectsService.getProjects();
    const matchedProject = projects.find(
      (project) =>
        this.normalizeStatusCode(project.name) ===
          this.normalizeStatusCode(projectName) &&
        String(project.clientId) === String(clientId) &&
        String(project.sellerId) === String(sellerId),
    );

    return matchedProject?.id ?? null;
  }
}
