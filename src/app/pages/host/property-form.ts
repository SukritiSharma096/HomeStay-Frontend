import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { concatMap, forkJoin, from } from 'rxjs';
import { ApiService } from '../../core/api.service';
import {
  Amenity,
  Availability,
  Destination,
  PROPERTY_TYPES,
  Property,
  PropertyImage,
  PropertyPayload,
  PropertyType,
} from '../../core/models';
import { errorMessage, randomSuffix, slugify, todayStr } from '../../core/util';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container section narrow">
      <a routerLink="/host" class="back-link">← My properties</a>
      <h1>{{ propertyId ? 'Edit property' : 'Add property' }}</h1>

      <div class="alert alert-success" *ngIf="success">{{ success }}</div>
      <div class="alert alert-error" *ngIf="error">{{ error }}</div>
      <div class="host-verification-banner" *ngIf="propertyStatus"><span>⌂</span><div><strong>Listing status · {{ propertyStatus }}</strong><small>{{ propertyStatus === 'APPROVED' ? 'Your listing is approved. Changes to listing details go through admin review again.' : propertyStatus === 'REJECTED' ? (reviewNote || 'Please update the details and contact support before resubmitting.') : propertyStatus === 'SUSPENDED' ? (reviewNote || 'This listing is currently hidden. Contact support for help.') : 'The admin team reviews new and edited listings before guests can book them.' }}</small></div></div>

      <p class="muted" *ngIf="loading">Loading...</p>

      <ng-container *ngIf="!loading">
        <form class="panel" [formGroup]="form" (ngSubmit)="save()">
          <h2>Basic details</h2>

          <div class="field">
            <label for="name">Property name</label>
            <input id="name" type="text" formControlName="name" />
            <span class="form-error" *ngIf="bad(form.controls.name)"
              >Name is required (2 to 150 characters).</span
            >
          </div>

          <div class="row">
            <div class="field">
              <label for="type">Type</label>
              <select id="type" formControlName="propertyType">
                <option *ngFor="let t of types" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="field">
              <label for="dest">Destination</label>
              <select id="dest" formControlName="destinationId">
                <option value="">Select destination</option>
                <option *ngFor="let d of destinations" [value]="d.id">{{ d.name }}</option>
              </select>
              <span class="form-error" *ngIf="bad(form.controls.destinationId)"
                >Please select a destination.</span
              >
              <span class="muted small" *ngIf="!destinations.length"
                >No destinations yet. Ask the admin to add your location.</span
              >
            </div>
          </div>

          <div class="field">
            <label for="address">Complete address</label>
            <input id="address" type="text" formControlName="address" placeholder="Street, area, landmark" /><span class="form-error" *ngIf="bad(form.controls.address)">Complete address is required.</span>
          </div>

          <div class="row row-3">
            <div class="field"><label for="city">City</label><input id="city" formControlName="city"><span class="form-error" *ngIf="bad(form.controls.city)">City is required.</span></div>
            <div class="field"><label for="state">State</label><input id="state" formControlName="state"><span class="form-error" *ngIf="bad(form.controls.state)">State is required.</span></div>
            <div class="field"><label for="postalCode">PIN code</label><input id="postalCode" formControlName="postalCode" inputmode="numeric" maxlength="6"><span class="form-error" *ngIf="bad(form.controls.postalCode)">Enter a valid 6-digit PIN code.</span></div>
          </div>

          <div class="field">
            <label for="desc">Description</label>
            <textarea id="desc" rows="5" formControlName="description"></textarea>
          </div>

          <h2>Capacity and price</h2>
          <div class="row row-4">
            <div class="field">
              <label for="price">Price / night (₹)</label>
              <input id="price" type="number" min="1" formControlName="pricePerNight" />
              <span class="form-error" *ngIf="bad(form.controls.pricePerNight)"
                >Enter a price.</span
              >
            </div>
            <div class="field">
              <label for="guests">Max guests per room</label>
              <input id="guests" type="number" min="1" formControlName="maxGuests" />
              <span class="form-error" *ngIf="bad(form.controls.maxGuests)">At least 1.</span>
            </div>
            <div class="field">
              <label for="beds">Bedrooms</label>
              <input id="beds" type="number" min="0" formControlName="bedrooms" />
            </div>
            <div class="field">
              <label for="baths">Bathrooms</label>
              <input id="baths" type="number" min="0" formControlName="bathrooms" />
            </div>
          </div>

          <h2>Property map location <span class="required-mark">Required</span></h2><p class="muted small">Find this address on a map and enter its coordinates below; both are required.</p><p><a class="link-button" [href]="mapSearchUrl" target="_blank" rel="noopener">Open map to find this location ↗</a></p>
          <button type="button" class="btn btn-outline btn-sm" (click)="useCurrentLocation()">Use this device's location</button>
          <div class="row">
            <div class="field">
              <label for="lat">Latitude</label>
              <input id="lat" type="number" step="any" formControlName="latitude" />
              <span class="form-error" *ngIf="bad(form.controls.latitude)">Latitude is required.</span>
            </div>
            <div class="field">
              <label for="lng">Longitude</label>
              <input id="lng" type="number" step="any" formControlName="longitude" />
              <span class="form-error" *ngIf="bad(form.controls.longitude)">Longitude is required.</span>
            </div>
          </div>

          <ng-container *ngIf="amenities.length">
            <h2>Amenities &amp; Facilities</h2>
            <div class="checks">
              <label class="check" *ngFor="let a of amenities">
                <input
                  type="checkbox"
                  [checked]="selectedAmenities.has(a.id)"
                  (change)="toggleAmenity(a.id, $any($event.target).checked)"
                />
                {{ a.name }}
              </label>
            </div>
          </ng-container>

          <div class="review-note"><span>✦</span><p>New listings and major changes are reviewed by the Havenstay team. Your stay goes live after approval.</p></div>

          <button class="btn btn-primary" type="submit" [disabled]="saving">
            {{ saving ? 'Saving...' : propertyId ? 'Save changes' : 'Create property' }}
          </button>
        </form>

        <ng-container *ngIf="propertyId">
          <!-- ---------------- photos ---------------- -->
          <div class="panel">
            <h2>Photos</h2>
            <p class="muted small">JPG, PNG or WEBP, up to 5 MB each. Maximum 15 photos.</p>

            <div class="alert alert-error" *ngIf="photoError">{{ photoError }}</div>

            <div class="photo-grid">
              <div class="photo" *ngFor="let img of images">
                <img [src]="img.imageUrl" alt="Property photo" />
                <span class="cover-tag" *ngIf="img.primaryImage">Cover</span>
                <button type="button" class="photo-del" (click)="deleteImage(img)">✕</button>
              </div>
            </div>

            <div class="upload-row">
              <label class="check">
                <input
                  type="checkbox"
                  [checked]="makeCover"
                  (change)="makeCover = $any($event.target).checked"
                />
                Use the first selected photo as cover
              </label>
              <label class="btn btn-outline" [class.disabled]="uploading">
                {{ uploading ? 'Uploading...' : '+ Add photos' }}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  [disabled]="uploading"
                  (change)="onFilesSelected($event)"
                />
              </label>
            </div>
          </div>

          <!-- ---------------- availability ---------------- -->
          <div class="panel">
            <h2>Availability</h2>
            <p class="muted small">
              Guests can only find your property for dates that you mark as available. Choose a
              date range and save. To close dates, untick "Available".
            </p>

            <div class="alert alert-error" *ngIf="availError">{{ availError }}</div>
            <div class="alert alert-success" *ngIf="availSuccess">{{ availSuccess }}</div>

            <form
              [formGroup]="availForm"
              (ngSubmit)="saveAvailability()"
              class="row row-4 avail-form"
            >
              <div class="field">
                <label for="a-from">From</label>
                <input id="a-from" type="date" formControlName="startDate" [min]="today" />
              </div>
              <div class="field">
                <label for="a-to">To (included)</label>
                <input
                  id="a-to"
                  type="date"
                  formControlName="endDate"
                  [min]="availForm.controls.startDate.value || today"
                />
              </div>
              <div class="field">
                <label for="a-units">Rooms / units</label>
                <input
                  id="a-units"
                  type="number"
                  min="0"
                  max="100"
                  formControlName="availableUnits"
                />
              </div>
              <div class="field">
                <label class="check"
                  ><input type="checkbox" formControlName="available" /> Available</label
                >
                <button class="btn btn-primary" type="submit" [disabled]="availSaving">
                  {{ availSaving ? 'Saving...' : 'Save dates' }}
                </button>
              </div>
            </form>

            <ng-container *ngIf="upcoming.length; else noDates">
              <h3>Upcoming dates</h3>
              <div class="chips">
                <span
                  class="chip"
                  *ngFor="let a of upcoming"
                  [class.chip-off]="!a.available || a.availableUnits === 0"
                >
                  {{ a.availableDate }} ·
                  {{ a.available && a.availableUnits > 0 ? a.availableUnits : 'closed' }}
                </span>
              </div>
            </ng-container>
            <ng-template #noDates><p class="muted">No dates added yet.</p></ng-template>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
})
export class PropertyFormPage {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  types = PROPERTY_TYPES;
  today = todayStr();

  propertyId: number | null = null;
  private existingSlug = '';
  propertyStatus = '';
  reviewNote = '';

  destinations: Destination[] = [];
  amenities: Amenity[] = [];
  selectedAmenities = new Set<number>();
  images: PropertyImage[] = [];
  upcoming: Availability[] = [];

  loading = true;
  saving = false;
  uploading = false;
  availSaving = false;
  makeCover = false;

  error = '';
  success = '';
  photoError = '';
  availError = '';
  availSuccess = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    propertyType: ['HOMESTAY' as PropertyType, Validators.required],
    destinationId: ['', Validators.required],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.maxLength(100)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    description: ['', Validators.maxLength(3000)],
    latitude: [null as number | null, Validators.required],
    longitude: [null as number | null, Validators.required],
    pricePerNight: [null as number | null, [Validators.required, Validators.min(1)]],
    maxGuests: [4, [Validators.required, Validators.min(1)]],
    bedrooms: [1, [Validators.required, Validators.min(0)]],
    bathrooms: [1, [Validators.required, Validators.min(0)]],
    active: [false],
  });

  availForm = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    availableUnits: [1, [Validators.required, Validators.min(0), Validators.max(100)]],
    available: [true],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('created')) {
      this.success = 'Property created! Now add photos and availability dates below.';
    }

    forkJoin({
      destinations: this.api.getDestinations(),
      amenities: this.api.getAmenities(),
    }).subscribe({
      next: ({ destinations, amenities }) => {
        this.destinations = destinations.filter((d) => d.active !== false);
        this.amenities = amenities.filter((a) => a.active !== false);
      },
      error: (err) => (this.error = errorMessage(err)),
    });

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);
      this.propertyId = id;

      this.api.getMyProperty(id).subscribe({
        next: (p) => {
          this.fill(p);
          this.loading = false;
        },
        error: (err) => {
          this.error = errorMessage(err);
          this.loading = false;
        },
      });

      this.loadAvailability(id);
    } else {
      this.loading = false;
    }
  }

  get mapSearchUrl(): string { const v = this.form.getRawValue(); return `https://www.openstreetmap.org/search?query=` + encodeURIComponent([v.address, v.city, v.state].filter(Boolean).join(', ')); }
  useCurrentLocation(): void { if (!navigator.geolocation) { this.error = 'Location is not available in this browser.'; return; } navigator.geolocation.getCurrentPosition(pos => this.form.patchValue({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }), () => this.error = 'Allow location access or enter the coordinates from the map.'); }

  bad(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  toggleAmenity(id: number, checked: boolean): void {
    if (checked) {
      this.selectedAmenities.add(id);
    } else {
      this.selectedAmenities.delete(id);
    }
  }

  // ---------------- property ----------------

  save(): void {
    this.error = '';
    this.success = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fix the highlighted fields.';
      return;
    }

    const v = this.form.getRawValue();
    const id = this.propertyId;

    const payload: PropertyPayload = {
      name: v.name.trim(),
      // the slug is created automatically and never changes after creation
      slug: id ? this.existingSlug : this.makeSlug(v.name),
      description: v.description.trim(),
      propertyType: v.propertyType,
      destinationId: Number(v.destinationId),
      address: v.address.trim(),
      city: v.city.trim(),
      state: v.state.trim(),
      postalCode: v.postalCode.trim(),
      latitude: v.latitude,
      longitude: v.longitude,
      pricePerNight: v.pricePerNight as number,
      maxGuests: v.maxGuests,
      bedrooms: v.bedrooms,
      bathrooms: v.bathrooms,
      active: v.active,
      amenityIds: Array.from(this.selectedAmenities),
    };

    this.saving = true;

    if (id) {
      this.api.updateProperty(id, payload).subscribe({
        next: (p) => {
          this.fill(p);
          this.saving = false;
          this.success = 'Changes saved.';
        },
        error: (err) => {
          this.error = errorMessage(err);
          this.saving = false;
        },
      });
    } else {
      this.api.createProperty(payload).subscribe({
        next: (p) =>
          this.router.navigate(['/host/property', p.id, 'edit'], {
            queryParams: { created: 1 },
          }),
        error: (err) => {
          this.error = errorMessage(err);
          this.saving = false;
        },
      });
    }
  }

  private makeSlug(name: string): string {
    const base = (slugify(name) || 'property').substring(0, 180);
    return `${base}-${randomSuffix()}`;
  }

  private fill(p: Property): void {
    this.existingSlug = p.slug;
    this.propertyStatus = p.status || (p.active ? 'APPROVED' : 'PENDING');
    this.reviewNote = p.reviewNote || '';
    this.form.patchValue({
      name: p.name,
      propertyType: p.propertyType,
      destinationId: String(p.destinationId),
      address: p.address ?? '',
      city: p.city ?? '',
      state: p.state ?? '',
      postalCode: p.postalCode ?? '',
      description: p.description ?? '',
      latitude: p.latitude,
      longitude: p.longitude,
      pricePerNight: p.pricePerNight,
      maxGuests: p.maxGuests,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      active: p.active,
    });
    this.selectedAmenities = new Set(p.amenityIds ?? []);
    this.images = p.images ?? [];
  }

  // ---------------- photos ----------------

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    input.value = '';

    const id = this.propertyId;
    if (!id || !picked.length) {
      return;
    }

    this.photoError = '';

    const files: File[] = [];
    for (const file of picked) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.photoError = `"${file.name}" is not a JPG, PNG or WEBP image.`;
        continue;
      }
      if (file.size > MAX_BYTES) {
        this.photoError = `"${file.name}" is bigger than 5 MB.`;
        continue;
      }
      files.push(file);
    }

    if (!files.length) {
      return;
    }

    this.uploading = true;

    // upload one by one
    from(files)
      .pipe(concatMap((file, index) => this.api.uploadImage(id, file, this.makeCover && index === 0)))
      .subscribe({
        next: (img) => {
          this.images = [
            ...this.images.map((i) => (img.primaryImage ? { ...i, primaryImage: false } : i)),
            img,
          ];
        },
        error: (err) => {
          this.photoError = errorMessage(err);
          this.uploading = false;
        },
        complete: () => (this.uploading = false),
      });
  }

  deleteImage(img: PropertyImage): void {
    if (!confirm('Delete this photo?')) {
      return;
    }
    this.photoError = '';
    this.api.deleteImage(img.id).subscribe({
      next: () => (this.images = this.images.filter((i) => i.id !== img.id)),
      error: (err) => (this.photoError = errorMessage(err)),
    });
  }

  // ---------------- availability ----------------

  saveAvailability(): void {
    this.availError = '';
    this.availSuccess = '';

    const id = this.propertyId;
    if (!id) {
      return;
    }

    if (this.availForm.invalid) {
      this.availForm.markAllAsTouched();
      this.availError = 'Select the from and to dates.';
      return;
    }

    const v = this.availForm.getRawValue();

    if (v.endDate < v.startDate) {
      this.availError = 'The "To" date must be on or after the "From" date.';
      return;
    }

    this.availSaving = true;

    this.api
      .setAvailabilityRange(id, {
        startDate: v.startDate,
        endDate: v.endDate,
        available: v.available,
        availableUnits: Number(v.availableUnits),
      })
      .subscribe({
        next: (rows) => {
          this.availSaving = false;
          this.availSuccess = `Saved ${rows.length} date${rows.length === 1 ? '' : 's'}.`;
          this.loadAvailability(id);
        },
        error: (err) => {
          this.availError = errorMessage(err);
          this.availSaving = false;
        },
      });
  }

  private loadAvailability(id: number): void {
    this.api.getAvailability(id).subscribe({
      next: (rows) => {
        const today = todayStr();
        this.upcoming = rows
          .filter((a) => a.availableDate >= today)
          .sort((a, b) => a.availableDate.localeCompare(b.availableDate))
          .slice(0, 120);
      },
      error: () => (this.upcoming = []),
    });
  }
}
