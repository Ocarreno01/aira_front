import { Routes } from '@angular/router';
import { AuthGuard } from '../../auth/auth.guard';
import { NegotiationListComponent } from './pages/negotiation-list/negotiation-list.component';
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
      {
        path: 'negotiation-list',
        component: NegotiationListComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];
