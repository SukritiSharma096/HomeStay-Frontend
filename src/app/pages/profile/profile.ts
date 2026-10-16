import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/util';

@Component({ selector: 'app-profile', standalone: true, imports: [CommonModule, ReactiveFormsModule], template: `
<section class="container section narrow"><p class="eyebrow">{{ auth.user?.role }} PROFILE</p><h1>Your profile</h1><p class="muted">Keep your account details up to date.</p>
<div class="alert alert-error" *ngIf="error">{{ error }}</div><div class="alert alert-success" *ngIf="notice">{{ notice }}</div>
<div class="panel profile-panel"><div class="profile-photo-wrap"><img *ngIf="auth.user?.profilePhotoUrl" [src]="auth.user?.profilePhotoUrl" alt="Profile photo"><div *ngIf="!auth.user?.profilePhotoUrl" class="profile-photo-placeholder">{{ auth.user?.fullName?.slice(0,1) }}</div><label class="btn btn-outline btn-sm">Change photo<input type="file" hidden accept="image/jpeg,image/png,image/webp" (change)="photo($event)"></label></div>
<form [formGroup]="form" (ngSubmit)="save()"><div class="field"><label>Full name</label><input formControlName="fullName" required></div><div class="field"><label>Email</label><input [value]="auth.user?.email" disabled></div><div class="field"><label>Phone</label><input [value]="auth.user?.phone" disabled></div><div class="field"><label>Date of birth</label><input type="date" formControlName="dateOfBirth"></div><div class="field"><label>Gender</label><select formControlName="gender"><option value="">Choose if you want</option><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="NON_BINARY">Non-binary</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></div><button class="btn btn-dark" [disabled]="saving">{{ saving ? 'Saving…' : 'Save profile' }}</button></form></div></section>` })
export class ProfilePage {
  auth = inject(AuthService); private api = inject(ApiService); private fb = inject(FormBuilder);
  error = ''; notice = ''; saving = false;
  form = this.fb.nonNullable.group({ fullName: [this.auth.user?.fullName || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]], dateOfBirth: [this.auth.user?.dateOfBirth || ''], gender: [this.auth.user?.gender || ''] });
  save(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.saving = true; this.api.updateProfile(this.form.getRawValue()).subscribe({ next: user => { this.auth.updateUser(user); this.notice = 'Profile saved.'; this.saving = false; }, error: e => { this.error = errorMessage(e); this.saving = false; } }); }
  photo(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; this.api.uploadProfilePhoto(file).subscribe({ next: user => { this.auth.updateUser(user); this.notice = 'Profile photo updated.'; }, error: e => this.error = errorMessage(e) }); }
}
