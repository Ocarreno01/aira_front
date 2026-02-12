import { Routes } from '@angular/router';
import { AuthGuard } from '../../auth/auth.guard';
import { ProjectListComponent } from './pages/project-list/project-list.component';

export const ProjectsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'project-list',
        component: ProjectListComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];
