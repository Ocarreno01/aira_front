import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../../material.module';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);
  private readonly projectsService = inject(ProjectsService);

  public isLoadingProjects = true;
  public projectListError = '';
  public deletingProjectId: string | number | null = null;
  public searchProjectTerm = '';

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
  public filteredDataSourceProjectList: ProjectListItem[] = [];

  public ngOnInit(): void {
    void this.loadProjects();
  }

  public async loadProjects(): Promise<void> {
    this.projectListError = '';
    this.isLoadingProjects = true;

    try {
      this.dataSourceProjectList = await this.projectsService.getProjects();
      console.log('this.dataSourceProjectList ', this.dataSourceProjectList);
      this.applySearchFilter(this.searchProjectTerm);
    } catch (error) {
      console.error('Error loading projects', error);
      this.projectListError = 'No fue posible cargar el listado de proyectos.';
      this.dataSourceProjectList = [];
      this.filteredDataSourceProjectList = [];
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
    return (
      this.normalizeStatus(project.statusCode) === 'en_negociacion' &&
      !!project.negotiationId
    );
  }

  public openNegotiationDetail(
    negotiationId: string | number | null,
  ): void {
    if (!negotiationId) {
      return;
    }

    void this.router.navigate(['/projects/negotiation-list', negotiationId], {
      queryParams: {
        from: 'project-list',
      },
    });
  }

  public applySearchFilter(value: string): void {
    this.searchProjectTerm = value;
    const normalizedTerm = this.normalizeSearchText(value);

    if (!normalizedTerm) {
      this.filteredDataSourceProjectList = [...this.dataSourceProjectList];
      return;
    }

    this.filteredDataSourceProjectList = this.dataSourceProjectList.filter(
      (project) =>
        this.buildProjectSearchIndex(project).includes(normalizedTerm),
    );
  }

  public clearSearch(): void {
    this.applySearchFilter('');
  }

  public getStatusClass(status: string): string {
    const baseClass = 'rounded font-semibold p-6 py-1 text-xs';
    const normalizedStatus = this.normalizeStatus(status);
    const statusClassMap: Record<string, string> = {
      oportunidad: `bg-light-info text-info ${baseClass}`,
      cotizacion_enviada: `bg-light-primary text-primary ${baseClass}`,
      en_negociacion: `bg-light-warning text-warning ${baseClass}`,
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

  private buildProjectSearchIndex(project: ProjectListItem): string {
    return this.normalizeSearchText(
      [
        project.id,
        project.name,
        project.clientName,
        project.sellerName,
        project.businessTypeName,
        project.estimatedValue,
        project.statusName,
        project.statusCode,
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
