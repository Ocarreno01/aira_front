import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../../material.module';
import { ConfirmProjectDeleteDialogComponent } from './components/confirm-project-delete-dialog/confirm-project-delete-dialog.component';
import {
  EditProjectDialogComponent,
  EditProjectDialogResult,
} from './components/edit-project-dialog/edit-project-dialog.component';
import {
  NewProjectDialogComponent,
  NewProjectDialogResult,
} from '../new-project-dialog/new-project-dialog.component';
import {
  ProjectListItem,
  ProjectsService,
} from '../../services/projects.service';

@Component({
  selector: 'app-project-list',
  imports: [MaterialModule, CurrencyPipe, TitleCasePipe],
  templateUrl: './project-list.component.html',
})
export class ProjectListComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly projectsService = inject(ProjectsService);

  public isLoadingProjects = true;
  public projectListError = '';
  public deletingProjectId: string | number | null = null;

  public displayedColumnsProjectList: string[] = [
    'projectName',
    'client',
    'seller',
    'businessType',
    'stimatedAmount',
    'status',
    'options',
  ];
  public dataSourceProjectList: ProjectListItem[] = [];

  public ngOnInit(): void {
    void this.loadProjects();
  }

  public async loadProjects(): Promise<void> {
    this.projectListError = '';
    this.isLoadingProjects = true;

    try {
      this.dataSourceProjectList = await this.projectsService.getProjects();
    } catch (error) {
      console.error('Error loading projects', error);
      this.projectListError = 'No fue posible cargar el listado de proyectos.';
      this.dataSourceProjectList = [];
    } finally {
      this.isLoadingProjects = false;
    }
  }

  public openNewProjectDialog(): void {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: NewProjectDialogResult | undefined) => {
        if (!result?.created) {
          return;
        }

        void this.loadProjects();
      });
  }

  public openEditProjectDialog(project: ProjectListItem): void {
    const dialogRef = this.dialog.open(EditProjectDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        project,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: EditProjectDialogResult | undefined) => {
        if (!result?.updated) {
          return;
        }

        void this.loadProjects();
      });
  }

  public openDeleteProjectDialog(project: ProjectListItem): void {
    const dialogRef = this.dialog.open(ConfirmProjectDeleteDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        projectName: project.name,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) {
        return;
      }

      void this.deleteProject(project);
    });
  }

  public canViewNegotiation(project: ProjectListItem): boolean {
    return this.normalizeStatus(project.statusCode) === 'en_negociacion';
  }

  public getStatusClass(status: string): string {
    const baseClass = 'rounded font-semibold p-6 py-1 text-xs';
    const normalizedStatus = this.normalizeStatus(status);
    const statusClassMap: Record<string, string> = {
      oportunidad: `bg-light-warning text-warning ${baseClass}`,
      cotizacion_enviada: `bg-light-error text-error ${baseClass}`,
      en_negociacion: `bg-light-success text-success ${baseClass}`,
      vendido: `bg-light-success text-success ${baseClass}`,
      facturado: `bg-light-success text-success ${baseClass}`,
    };

    return (
      statusClassMap[normalizedStatus] ??
      `bg-light-primary text-primary ${baseClass}`
    );
  }

  public formatStatusLabel(status: string): string {
    if (!status) {
      return 'Desconocido';
    }

    return status.replaceAll('_', ' ');
  }

  private async deleteProject(project: ProjectListItem): Promise<void> {
    this.deletingProjectId = project.id;
    this.projectListError = '';

    try {
      await this.projectsService.deleteProject(project.id);
      await this.loadProjects();
    } catch (error) {
      console.error('Error deleting project', error);
      this.projectListError = 'No fue posible eliminar el proyecto.';
    } finally {
      this.deletingProjectId = null;
    }
  }

  private normalizeStatus(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replaceAll('-', '_')
      .replaceAll(' ', '_');
  }
}
