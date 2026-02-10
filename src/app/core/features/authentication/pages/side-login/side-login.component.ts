import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/core/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
  ) {}

  public loading = false;
  public error = '';

  public loginForm = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.loginForm.controls;
  }

  public async submit(): Promise<void> {
    this.error = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const username = this.f.uname.value as string;
      const password = this.f.password.value as string;

      const ok = await this.auth.login(username, password);

      if (ok) {
        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

        this.router.navigateByUrl(returnUrl);
      } else {
        this.error = 'Usuario o contraseña inválidos';
      }
    } finally {
      this.loading = false;
    }
  }
}
