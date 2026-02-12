import { Routes } from '@angular/router';
import { BlankComponent } from '../template/layouts/blank/blank.component';
import { FullComponent } from '../template/layouts/full/full.component';

import { AuthGuard } from '../core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'template',
    component: FullComponent,
    canActivate: [],
    children: [
      {
        path: '',
        redirectTo: '/template/dashboard-template',
        pathMatch: 'full',
      },
      {
        path: 'dashboard-template',
        loadChildren: () =>
          import('../template/pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'ui-components-template',
        loadChildren: () =>
          import('../template/pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes,
          ),
      },
      {
        path: 'extra-template',
        loadChildren: () =>
          import('../template/pages/extra/extra.routes').then(
            (m) => m.ExtraRoutes,
          ),
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
