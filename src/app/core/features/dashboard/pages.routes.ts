import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/main-dashboard/dashboard.component';

export const DashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {
      title: 'Dashboard',
      urls: [{ title: 'Dashboard', url: '/dashboard' }, { title: 'Dashboard' }],
    },
  },
];
