import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container auth-wrap">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="eyebrow">WELCOME BACK</p>
        <h1>Sign in to your account</h1>
        <p class="muted">Continue your trips, manage your hosted stays, or open your admin workspace.</p>

        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          <span class="form-error" *ngIf="form.controls.email.touched && form.controls.email.invalid"
            >Enter a valid email.</span
          >
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
          <span
            class="form-error"
            *ngIf="form.controls.password.touched && form.controls.password.invalid"
            >Password is required.</span
          >
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <p class="muted center">New host? <a routerLink="/register">Create an account</a></p>
      </form>
    </div>
  `,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const back = this.route.snapshot.queryParamMap.get('returnUrl');
        // only allow in-app paths
        const fallback = this.auth.user?.role === 'ADMIN' ? '/admin' : this.auth.user?.role === 'HOST' ? '/host' : '/search';
        const safe = back && back.startsWith('/') && !back.startsWith('//') ? back : fallback;
        this.router.navigateByUrl(safe);
      },
      error: (err) => {
        this.error = errorMessage(err);
        this.loading = false;
      },
    });
  }
}
