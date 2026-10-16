import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container auth-wrap">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="eyebrow">JOIN HAVENSTAY</p>
        <h1>Create your account</h1>
        <p class="muted">Book a memorable stay or welcome guests into a home of your own.</p>
        <div class="role-picker" role="radiogroup" aria-label="Account type">
          <label [class.selected]="form.controls.role.value === 'GUEST'"><input type="radio" formControlName="role" value="GUEST"><span class="role-icon">✦</span><strong>I'm a guest</strong><small>Discover and book a stay</small></label>
          <label [class.selected]="form.controls.role.value === 'HOST'"><input type="radio" formControlName="role" value="HOST"><span class="role-icon">⌂</span><strong>I'm a host</strong><small>List and manage a home</small></label>
        </div>

        <div class="alert alert-error" *ngIf="error">{{ error }}</div><div class="alert alert-success" *ngIf="notice">{{ notice }}</div>

        <div class="field">
          <label for="fullName">Full name</label>
          <input id="fullName" type="text" formControlName="fullName" autocomplete="name" />
          <span
            class="form-error"
            *ngIf="form.controls.fullName.touched && form.controls.fullName.invalid"
            >Enter your name (at least 2 characters).</span
          >
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" (input)="emailVerified = false" />
          <span class="form-error" *ngIf="form.controls.email.touched && form.controls.email.invalid"
            >Enter a valid email.</span
          >
          <button class="btn btn-outline btn-sm" type="button" [disabled]="form.controls.email.invalid || emailSending" (click)="sendCode('email')">{{ emailSending ? 'Sending…' : emailVerified ? 'Email verified ✓' : 'Send email OTP' }}</button>
          <div class="inline-form" *ngIf="emailCodeSent && !emailVerified"><input aria-label="Email OTP" inputmode="numeric" maxlength="6" [value]="emailOtp" (input)="emailOtp = $any($event.target).value" placeholder="6-digit email code"><button class="btn btn-outline btn-sm" type="button" (click)="verifyCode('email')">Verify email</button></div>
        </div>

        <div class="field">
          <label for="phone">Phone number <span class="required-mark">*</span></label>
          <input id="phone" type="tel" formControlName="phone" autocomplete="tel" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number" required />
          <span class="form-error" *ngIf="form.controls.phone.touched && form.controls.phone.invalid"
            >Enter a valid 10-digit phone number.</span
          >
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="new-password"
          />
          <span
            class="form-error"
            *ngIf="form.controls.password.touched && form.controls.password.invalid"
            >Password must be at least 8 characters.</span
          >
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading || !emailVerified">
          {{ loading ? 'Creating account...' : 'Create account' }}
        </button>

        <p class="muted center">Already have an account? <a routerLink="/login">Login</a></p>
      </form>
    </div>
  `,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  error = '';
  notice = '';
  emailVerified = false;
  emailCodeSent = false;
  emailSending = false;
  emailOtp = '';

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    role: [(this.route.snapshot.queryParamMap.get('role') === 'HOST' ? 'HOST' : 'GUEST') as 'GUEST' | 'HOST'],
  });

  submit(): void {
    if (!this.emailVerified) { this.error = 'Verify your email before creating your account.'; return; }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.auth.user?.role === 'HOST' ? '/host' : '/search'),
      error: (err) => {
        this.error = errorMessage(err);
        this.loading = false;
      },
    });
  }

  sendCode(channel: 'email'): void {
    const control = this.form.controls.email;
    if (control.invalid) { control.markAsTouched(); return; }
    this.emailSending = true;
    this.error = '';
    this.api.sendVerification(channel, control.value).subscribe({
      next: () => { this.emailSending = false; this.emailCodeSent = true; this.emailOtp = ''; this.notice = 'Verification email sent.'; },
      error: err => { this.emailSending = false; this.error = errorMessage(err); },
    });
  }

  verifyCode(channel: 'email'): void {
    const identifier = this.form.controls.email.value;
    const code = this.emailOtp;
    this.api.verifyCode(channel, identifier, code).subscribe({
      next: () => { this.emailVerified = true; this.error = ''; this.notice = 'Your email is verified.'; },
      error: err => this.error = errorMessage(err),
    });
  }
}
