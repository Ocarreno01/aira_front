import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../../material.module';
import {
  NewProjectDialogComponent,
  NewProjectDialogResult,
} from '../new-project-dialog/new-project-dialog.component';
import { ProjectsService } from '../../services/projects.service';

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

  public displayedColumnsProjectList: string[] = [
    'projectName',
    'client',
    'seller',
    'businessType',
    'stimatedAmount',
    'status',
    'options',
  ];
  public dataSourceProjectList: unknown[] = [];

  public ngOnInit(): void {
    void this.loadProjects();
  }

  public async loadProjects(): Promise<void> {
    this.projectListError = '';
    this.isLoadingProjects = true;

    try {
      this.dataSourceProjectList = await this.projectsService.getProjects();
      console.log('this.dataSourceProjectList ', this.dataSourceProjectList);
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

  public getStatusClass(status: string): string {
    const baseClass = 'rounded font-semibold p-6 py-1 text-xs';
    const statusClassMap: Record<string, string> = {
      oportunidad: `bg-light-warning text-warning ${baseClass}`,
      cotizacion_enviada: `bg-light-error text-error ${baseClass}`,
      en_negociacion: `bg-light-success text-success ${baseClass}`,
      vendido: `bg-light-success text-success ${baseClass}`,
      facturado: `bg-light-success text-success ${baseClass}`,
    };

    return (
      statusClassMap[status] ?? `bg-light-primary text-primary ${baseClass}`
    );
  }

  public formatStatusLabel(status: string): string {
    if (!status) {
      return 'Desconocido';
    }

    return status.replaceAll('_', ' ');
  }
}
