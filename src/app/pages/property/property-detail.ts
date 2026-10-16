import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Property } from '../../core/models';
import { errorMessage, mainImage, todayStr } from '../../core/util';
import { PropertyCard } from '../../shared/property-card';
import { openCheckout } from '../../core/razorpay';

@Component({
  selector: 'app-property-detail', standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PropertyCard],
  template: `
    <section class="container section">
      <a routerLink="/search" class="back-link">← Back to stays</a>
      <p class="muted" *ngIf="loading">Finding the details...</p>
      <div class="alert alert-error" *ngIf="!loading && error">{{ error }}</div>
      <ng-container *ngIf="property as p">
        <div class="detail-heading"><div><p class="eyebrow">{{ p.destinationName }} · {{ label(p.propertyType) }}</p><h1 class="detail-title">{{ p.name }}</h1><p class="muted">{{ p.address }}<span *ngIf="p.city">, {{ p.city }}</span><span *ngIf="p.state">, {{ p.state }}</span><span *ngIf="p.postalCode"> – {{ p.postalCode }}</span> <span *ngIf="p.rating"> · ★ {{ p.rating | number:'1.1-1' }} ({{ p.totalReviews }} stays)</span></p></div><span class="trust-pill">✦ Local host · verified listing</span></div>
        <div class="gallery">
          <img *ngIf="selected; else noPhoto" class="gallery-main" [src]="selected" [alt]="p.name">
          <ng-template #noPhoto><div class="gallery-main no-img">A lovely stay is waiting</div></ng-template>
          <div class="thumbs" *ngIf="p.images.length > 1"><button type="button" *ngFor="let img of p.images" [class.active]="img.imageUrl === selected" (click)="selected = img.imageUrl"><img [src]="img.imageUrl" [alt]="p.name"></button></div>
        </div>
        <div class="detail-layout">
          <div class="detail-copy">
            <div class="facts"><div><strong>{{ p.maxGuests }} / room</strong><span>Guest limit</span></div><div><strong>{{ p.bedrooms }}</strong><span>Bedrooms</span></div><div><strong>{{ p.bathrooms }}</strong><span>Bathrooms</span></div><div><strong>{{ p.propertyType === 'HOMESTAY' ? 'Home' : label(p.propertyType) }}</strong><span>Stay type</span></div></div>
            <section><p class="eyebrow">A LITTLE ABOUT THIS PLACE</p><h2>Make yourself at home</h2><p class="description">{{ p.description || 'A comfortable locally hosted stay, ready to make your trip memorable.' }}</p></section>
            <section *ngIf="p.amenities?.length"><p class="eyebrow">THE GOOD THINGS</p><h2>What this stay offers</h2><div class="amenity-grid"><div *ngFor="let amenity of p.amenities"><span class="amenity-check">✓</span>{{ amenity }}</div></div></section>
            <section *ngIf="mapLink"><p class="eyebrow">GETTING THERE</p><h2>Explore the neighbourhood</h2><a class="btn btn-soft" [href]="mapLink" target="_blank" rel="noopener">Open location in Google Maps ↗</a></section>
          </div>
          <aside class="booking-card">
            <p class="eyebrow">YOUR GETAWAY</p><div class="price big">₹{{ p.pricePerNight | number:'1.0-0' }} <small>/ night</small></div><p class="muted small">No hidden booking fee · Secure online payment</p>
            <form [formGroup]="form" (ngSubmit)="book()" class="booking-fields">
              <div class="field"><label for="ci">Check-in</label><input id="ci" type="date" [min]="today" formControlName="checkIn" (change)="refreshAvailability()"></div>
              <div class="field"><label for="co">Check-out</label><input id="co" type="date" [min]="form.controls.checkIn.value || today" formControlName="checkOut" (change)="refreshAvailability()"></div>
              <div class="counter-field"><span class="counter-label">Guests <small>up to {{ p.maxGuests }} per room</small></span><div class="stepper"><button type="button" aria-label="Decrease guests" [disabled]="form.controls.guests.value <= 1" (click)="changeCount('guests', -1)">−</button><output>{{ form.controls.guests.value }} {{ form.controls.guests.value === 1 ? 'guest' : 'guests' }}</output><button type="button" aria-label="Increase guests" [disabled]="form.controls.guests.value >= maxGuests" (click)="changeCount('guests', 1)">+</button></div></div>
              <div class="counter-field"><span class="counter-label">Rooms</span><div class="stepper"><button type="button" aria-label="Decrease rooms" [disabled]="form.controls.rooms.value <= 1" (click)="changeCount('rooms', -1)">−</button><output>{{ form.controls.rooms.value }} {{ form.controls.rooms.value === 1 ? 'room' : 'rooms' }}</output><button type="button" aria-label="Increase rooms" [disabled]="form.controls.rooms.value >= 10" (click)="changeCount('rooms', 1)">+</button></div><small class="muted">{{ availabilityBusy ? 'Checking availability…' : availabilityRooms === null ? 'Choose dates to check availability.' : availabilityRooms + ' room(s) available for these dates.' }}</small><small class="form-error" *ngIf="availabilityRooms !== null && form.controls.rooms.value > availabilityRooms">Only {{ availabilityRooms }} room(s) available. Reduce the number of rooms.</small></div>
              <div class="stay-total" *ngIf="nights"><span>₹{{ p.pricePerNight | number:'1.0-0' }} × {{ nights }} nights × {{ form.controls.rooms.value }} {{ form.controls.rooms.value === 1 ? 'room' : 'rooms' }}</span><strong>₹{{ estimate | number:'1.0-0' }}</strong></div>
              <div class="alert alert-error" *ngIf="error">{{ error }}</div>
              <button class="btn btn-dark btn-block booking-submit" type="submit" [disabled]="busy">{{ busy ? 'Opening secure checkout…' : nights ? 'Reserve · ₹' + (estimate | number:'1.0-0') : 'Check dates & reserve' }}</button>
            </form>
            <p class="small muted center">You won't be charged until you complete payment.</p>
          </aside>
        </div>
        <section class="recommend-section" *ngIf="related.length"><div class="section-title-row"><div><p class="eyebrow">MORE PLACES NEARBY</p><h2>Other stays you might love</h2></div><a [routerLink]="['/search']" [queryParams]="{ destinationId: p.destinationId }">View all →</a></div><div class="grid card-grid"><app-property-card *ngFor="let item of related" [property]="item"></app-property-card></div></section>
      </ng-container>
    </section>
  `,
})
export class PropertyDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  property: Property | null = null;
  related: Property[] = [];
  loading = true;
  busy = false;
  error = '';
  availabilityRooms: number | null = null;
  availabilityBusy = false;
  selected: string | null = null;
  today = todayStr();
  form = this.fb.nonNullable.group({
    checkIn: [this.route.snapshot.queryParamMap.get('checkIn') || '', Validators.required],
    checkOut: [this.route.snapshot.queryParamMap.get('checkOut') || '', Validators.required],
    guests: [Number(this.route.snapshot.queryParamMap.get('guests') || 2), [Validators.required, Validators.min(1)]],
    rooms: [Number(this.route.snapshot.queryParamMap.get('rooms') || 1), [Validators.required, Validators.min(1)]],
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getProperty(id).subscribe({
      next: property => {
        this.property = property;
        const wantedGuests = Math.max(1, Number(this.form.controls.guests.value || 2));
        const roomsForParty = Math.ceil(wantedGuests / Math.max(1, property.maxGuests || 1));
        this.form.controls.rooms.setValue(Math.min(10, Math.max(Number(this.form.controls.rooms.value || 1), roomsForParty)));
        this.form.controls.guests.setValue(Math.min(Number(this.form.controls.guests.value || 2), this.maxGuests));
        this.selected = mainImage(property);
        this.loading = false;
        this.refreshAvailability();
        this.api.getPropertiesByDestination(property.destinationId).subscribe({
          next: rows => this.related = rows.filter(row => row.id !== property.id).slice(0, 4),
          error: () => this.related = [],
        });
      },
      error: err => { this.error = err?.status === 404 ? 'This stay is not available anymore.' : errorMessage(err); this.loading = false; },
    });
  }

  get nights(): number {
    const { checkIn, checkOut } = this.form.getRawValue();
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);
  }
  get estimate(): number { return (this.property?.pricePerNight || 0) * this.nights * Number(this.form.controls.rooms.value || 1); }
  get maxGuests(): number { return Number(this.form.controls.rooms.value || 1) * Number(this.property?.maxGuests || 1); }
  get roomOptions(): number[] { return Array.from({ length: 10 }, (_, i) => i + 1); }
  changeCount(field: 'guests' | 'rooms', delta: number): void {
    const control = this.form.controls[field];
    const max = field === 'guests' ? this.maxGuests : 10;
    control.setValue(Math.max(1, Math.min(max, Number(control.value) + delta)));
    if (field === 'rooms') { this.form.controls.guests.setValue(Math.min(this.form.controls.guests.value, this.maxGuests)); this.refreshAvailability(); }
  }
  refreshAvailability(): void {
    const p = this.property, { checkIn, checkOut } = this.form.getRawValue();
    if (!p || !checkIn || !checkOut || checkOut <= checkIn) { this.availabilityRooms = null; return; }
    this.availabilityBusy = true;
    this.api.checkAvailability(p.id, checkIn, checkOut).subscribe({ next: result => { this.availabilityRooms = result.availableRooms; this.availabilityBusy = false; }, error: () => { this.availabilityRooms = 0; this.availabilityBusy = false; } });
  }
  label(value: string): string { return value.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
  get mapLink(): string {
    const p = this.property;
    if (!p) return '';
    if (p.latitude != null && p.longitude != null) return `https://www.google.com/maps?q=${p.latitude},${p.longitude}`;
    return p.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address + ' ' + p.destinationName)}` : '';
  }

  book(): void {
    this.error = '';
    const p = this.property;
    const date = this.form.getRawValue();
    if (!p) return;
    if (this.form.invalid || !this.nights) { this.error = 'Choose a check-in and a later check-out date.'; return; }
    if (date.checkIn < this.today) { this.error = 'Check-in must be today or a future date.'; return; }
    if (Number(date.guests) > Number(date.rooms) * Number(p.maxGuests)) { this.error = `Choose no more than ${p.maxGuests} guests per room.`; return; }
    if (this.availabilityRooms !== null && Number(date.rooms) > this.availabilityRooms) { this.error = `Only ${this.availabilityRooms} room(s) are available for these dates.`; return; }
    if (Number(date.rooms) < 1 || Number(date.rooms) > 10) { this.error = 'Choose between 1 and 10 rooms.'; return; }
    if (this.auth.user?.role !== 'GUEST') {
      if (!this.auth.isLoggedIn) {
        const returnUrl = `/property/${p.id}?checkIn=${date.checkIn}&checkOut=${date.checkOut}&guests=${date.guests}&rooms=${date.rooms}`;
        this.router.navigate(['/login'], { queryParams: { returnUrl } });
      } else {
        this.error = 'Bookings are available from a guest account. Please sign out and sign in as a guest.';
      }
      return;
    }
    this.busy = true;
    this.api.createBooking({ propertyId: p.id, checkIn: date.checkIn, checkOut: date.checkOut, guests: Number(date.guests), rooms: Number(date.rooms) }).subscribe({
      next: booking => openCheckout(booking, this.auth.user!, this.api, busy => this.busy = busy,
        () => this.router.navigate(['/my-bookings'], { queryParams: { paid: booking.id } }),
        message => this.error = message),
      error: err => { this.error = errorMessage(err); this.busy = false; },
    });
  }
}
