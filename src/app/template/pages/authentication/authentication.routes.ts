import { Routes } from '@angular/router';

import { AppSideLoginComponent } from './side-login/side-login.component';
import { AppSideRegisterComponent } from './side-register/side-register.component';

import { GuestGuard } from '../../auth/guest.guard';

export const AuthenticationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        component: AppSideLoginComponent,
        canActivate: [GuestGuard],
      },
      {
        path: 'register',
        component: AppSideRegisterComponent,
        canActivate: [GuestGuard],
      },
    ],
  },
];
