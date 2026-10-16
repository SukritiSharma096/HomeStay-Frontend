import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Destination } from '../core/models';
import { todayStr } from '../core/util';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="search-box" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label for="sf-dest">Where</label>
        <select id="sf-dest" formControlName="destinationId">
          <option value="">All destinations</option>
          <option *ngFor="let d of destinations" [value]="d.id">{{ d.name }}</option>
        </select>
      </div>
      <div class="field">
        <label for="sf-in">Check-in</label>
        <input id="sf-in" type="date" formControlName="checkIn" [min]="today" />
      </div>
      <div class="field">
        <label for="sf-out">Check-out</label>
        <input
          id="sf-out"
          type="date"
          formControlName="checkOut"
          [min]="form.controls.checkIn.value || today"
        />
      </div>
      <div class="field">
        <label for="sf-guests">Guests</label>
        <select id="sf-guests" formControlName="guests">
          <option value="">Any</option>
          <option *ngFor="let n of guestOptions" [value]="n">{{ n }}</option>
        </select>
      </div>
      <button class="btn btn-primary" type="submit">Search</button>
      <p class="form-error search-error" *ngIf="error">{{ error }}</p>
    </form>
  `,
})
export class SearchForm {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  today = todayStr();
  guestOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12];
  destinations: Destination[] = [];
  error = '';

  private q = this.route.snapshot.queryParamMap;

  form = this.fb.nonNullable.group({
    destinationId: [this.q.get('destinationId') ?? ''],
    checkIn: [this.q.get('checkIn') ?? ''],
    checkOut: [this.q.get('checkOut') ?? ''],
    guests: [this.q.get('guests') ?? ''],
  });

  constructor() {
    this.api.getDestinations().subscribe({
      next: (list) => (this.destinations = list.filter((d) => d.active !== false)),
      error: () => (this.destinations = []),
    });
  }

  submit(): void {
    const v = this.form.getRawValue();

    if ((v.checkIn && !v.checkOut) || (!v.checkIn && v.checkOut)) {
      this.error = 'Please select both check-in and check-out dates.';
      return;
    }
    if (v.checkIn && v.checkOut && v.checkOut <= v.checkIn) {
      this.error = 'Check-out must be after check-in.';
      return;
    }
    this.error = '';

    const queryParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(v)) {
      if (value) {
        queryParams[key] = value;
      }
    }
    this.router.navigate(['/search'], { queryParams });
  }
}
