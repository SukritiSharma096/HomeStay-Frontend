import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, catchError, of, switchMap, takeUntil, tap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Amenity, PROPERTY_TYPES, Property, PropertySearchResponse } from '../../core/models';
import { errorMessage } from '../../core/util';
import { PropertyCard } from '../../shared/property-card';
import { SearchForm } from '../../shared/search-form';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchForm, PropertyCard],
  template: `
    <section class="search-top">
      <div class="container">
        <app-search-form></app-search-form>
      </div>
    </section>

    <section class="container section">
      <div class="search-heading"><div><p class="eyebrow">THE GOOD STAY GUIDE</p><h1>Find your place to stay</h1><p class="muted">Thoughtful homes for wherever you're headed.</p></div><span class="trust-pill">✦ Host-led stays</span></div>
      <form class="filters" [formGroup]="filters" (ngSubmit)="applyFilters()">
        <div class="field">
          <label for="f-min">Min price / night (₹)</label>
          <input id="f-min" type="number" min="0" formControlName="minPrice" />
        </div>
        <div class="field">
          <label for="f-type">Type</label>
          <select id="f-type" formControlName="propertyType">
            <option value="">Any</option>
            <option *ngFor="let t of types" [value]="t">{{ t }}</option>
          </select>
        </div>
        <div class="field">
          <label for="f-price">Max price / night (₹)</label>
          <input id="f-price" type="text" inputmode="numeric" formControlName="maxPrice" />
        </div>
        <div class="field">
          <label for="f-sort">Sort by</label>
          <select id="f-sort" formControlName="sortBy">
            <option value="">Recommended</option>
            <option value="PRICE_LOW_TO_HIGH">Price: low to high</option>
            <option value="PRICE_HIGH_TO_LOW">Price: high to low</option>
            <option value="RATING_HIGH_TO_LOW">Rating</option>
          </select>
        </div>
        <button class="btn btn-outline" type="submit">Apply</button>
      </form>

      <div class="filter-chip-row" *ngIf="amenities.length"><span class="muted small">STAY ESSENTIALS</span><button type="button" *ngFor="let a of amenities" [class.chip-selected]="amenityFilter === a.name" (click)="toggleAmenity(a.name)">{{ a.name }}</button></div>

      <p class="muted" *ngIf="loading">Searching...</p>
      <div class="alert alert-error" *ngIf="!loading && error">{{ error }}</div>

      <ng-container *ngIf="!loading && !error && result as r">
        <h2>
          {{ filteredProperties.length }} {{ filteredProperties.length === 1 ? 'stay' : 'stays' }}
          <ng-container *ngIf="r.destination">in {{ r.destination }}</ng-container>
        </h2>
        <div class="grid card-grid" *ngIf="filteredProperties.length; else none">
          <app-property-card
            *ngFor="let p of filteredProperties"
            [property]="p"
            [dates]="datesParams"
          ></app-property-card>
        </div>
        <ng-template #none>
          <p class="muted">No stays found. Try different dates or remove some filters.</p>
        </ng-template>
      </ng-container>
    </section>
  `,
})
export class SearchPage implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  types = PROPERTY_TYPES;
  amenities: Amenity[] = [];
  amenityFilter = '';

  loading = true;
  error = '';
  result: PropertySearchResponse | null = null;
  query: Params = {};

  filters = this.fb.nonNullable.group({
    propertyType: [''],
    minPrice: [''],
    maxPrice: [''],
    sortBy: [''],
  });

  // dates and guests are passed on to the detail page
  get datesParams(): Params {
    const out: Params = {};
    for (const key of ['checkIn', 'checkOut', 'guests']) {
      if (this.query[key]) {
        out[key] = this.query[key];
      }
    }
    return out;
  }

  constructor() {
    this.api.getAmenities().subscribe({ next: rows => this.amenities = rows.filter(a => a.active !== false), error: () => this.amenities = [] });
    this.route.queryParams
      .pipe(
        tap((q) => {
          this.query = q;
          this.amenityFilter = q['amenity'] || '';
          this.filters.patchValue({
            propertyType: q['propertyType'] ?? '',
            minPrice: q['minPrice'] ?? '',
            maxPrice: q['maxPrice'] ?? '',
            sortBy: q['sortBy'] ?? '',
          });
          this.loading = true;
          this.error = '';
        }),
        switchMap((q) =>
          this.api
            .searchProperties({
              destinationId: q['destinationId'],
              checkIn: q['checkIn'],
              checkOut: q['checkOut'],
              guests: q['guests'],
              minPrice: q['minPrice'],
              maxPrice: q['maxPrice'],
              propertyType: q['propertyType'],
              sortBy: q['sortBy'],
            })
            .pipe(
              catchError((err) => {
                this.error = errorMessage(err);
                return of(null);
              }),
            ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        this.result = res;
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    const v = this.filters.getRawValue();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        propertyType: v.propertyType || null,
        minPrice: v.minPrice.replace(/\D/g, '') || null,
        maxPrice: v.maxPrice.replace(/\D/g, '') || null,
        sortBy: v.sortBy || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  get filteredProperties(): Property[] {
    const rows = this.result?.properties || [];
    if (!this.amenityFilter) return rows;
    const desired = this.amenityFilter.toLowerCase();
    return rows.filter(property => (property.amenities || []).some(value => value.toLowerCase() === desired));
  }

  toggleAmenity(name: string): void {
    const selected = this.amenityFilter === name ? null : name;
    this.router.navigate([], { relativeTo: this.route, queryParams: { amenity: selected }, queryParamsHandling: 'merge' });
  }
}
