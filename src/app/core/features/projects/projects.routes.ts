import { Routes } from '@angular/router';
import { AuthGuard } from '../../auth/auth.guard';
import { NegotiationDetailComponent } from './pages/negotiation-detail/negotiation-detail.component';
import { NegotiationListComponent } from './pages/negotiation-list/negotiation-list.component';
import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ReportsComponent } from './pages/reports/reports.component';

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
      {
        path: 'negotiation-list/:id',
        component: NegotiationDetailComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];
