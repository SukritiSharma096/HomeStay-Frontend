import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Booking } from '../../core/models';
import { errorMessage } from '../../core/util';
import { openCheckout } from '../../core/razorpay';

@Component({
  selector: 'app-my-bookings', standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <section class="container section">
      <div class="page-head"><div><p class="eyebrow">YOUR GETAWAYS</p><h1>My trips</h1><p class="muted">Every reservation, all in one place.</p></div><a routerLink="/search" class="btn btn-soft">Find another stay ↗</a></div>
      <div class="alert alert-success" *ngIf="paidNotice">Payment confirmed — your trip is ready.</div>
      <p class="muted" *ngIf="loading">Loading your trips…</p>
      <div class="alert alert-error" *ngIf="!loading && error">{{ error }}</div>
      <div class="trip-list" *ngIf="!loading && bookings.length">
        <article class="trip-card" *ngFor="let trip of bookings">
          <div class="trip-cover"><img *ngIf="trip.imageUrl; else stayPlaceholder" [src]="trip.imageUrl" [alt]="trip.propertyName"><ng-template #stayPlaceholder><div class="no-img">Havenstay</div></ng-template></div>
          <div class="trip-main"><div class="trip-top"><span class="status-pill" [ngClass]="statusClass(trip)">{{ statusLabel(trip) }}</span><span class="muted small">Booking #{{ trip.id }}</span></div><h2>{{ trip.propertyName }}</h2><p>{{ trip.checkIn | date:'EEE, d MMM yyyy' }} — {{ trip.checkOut | date:'EEE, d MMM yyyy' }}</p><p class="muted">{{ trip.guests }} {{ trip.guests === 1 ? 'guest' : 'guests' }} · {{ trip.rooms || 1 }} {{ (trip.rooms || 1) === 1 ? 'room' : 'rooms' }} · {{ nights(trip) }} nights · {{ paymentLabel(trip.paymentStatus) }}</p><div class="trip-actions"><a [routerLink]="['/property', trip.propertyId]" class="text-link">View stay</a><a routerLink="/support" [queryParams]="{ bookingId: trip.id }" class="text-link">Get help</a><button *ngIf="trip.status === 'PENDING_PAYMENT' && trip.paymentOrderId && trip.paymentKeyId" type="button" class="btn btn-dark btn-sm" [disabled]="payingId === trip.id" (click)="pay(trip)">{{ payingId === trip.id ? 'Opening…' : 'Complete payment' }}</button><button *ngIf="trip.status === 'PENDING_PAYMENT' || trip.status === 'CONFIRMED'" type="button" class="link-button danger-text" (click)="cancel(trip)">Cancel trip</button></div></div>
          <div class="trip-price"><span class="muted small">TOTAL</span><strong>₹{{ trip.totalPrice | number:'1.0-0' }}</strong><small>{{ trip.currency || 'INR' }}</small></div>
        </article>
      </div>
      <div class="empty-state" *ngIf="!loading && !error && !bookings.length"><div class="empty-icon">⌂</div><p class="eyebrow">A GOOD TRIP STARTS HERE</p><h2>Your next stay is out there</h2><p class="muted">Search local homes, choose your dates and book securely.</p><a routerLink="/search" class="btn btn-dark">Explore stays</a></div>
    </section>
  `,
})
export class MyBookingsPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  bookings: Booking[] = [];
  loading = true;
  error = '';
  paidNotice = new URLSearchParams(window.location.search).has('paid');
  payingId: number | null = null;

  constructor() { this.load(); }
  load(): void { this.api.getMyBookings().subscribe({ next: rows => { this.bookings = rows; this.loading = false; }, error: err => { this.error = errorMessage(err); this.loading = false; } }); }
  nights(booking: Booking): number { return Math.max(1, Math.round((Date.parse(booking.checkOut) - Date.parse(booking.checkIn)) / 86400000)); }
  statusLabel(booking: Booking): string {
    if (booking.paymentStatus === 'REFUND_PENDING') return 'Refund processing';
    if (booking.paymentStatus === 'REFUNDED') return 'Refunded';
    if (booking.status === 'PENDING_PAYMENT') return 'Payment pending';
    return booking.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase());
  }
  statusClass(booking: Booking): string {
    if (booking.paymentStatus === 'REFUNDED' || booking.status === 'CANCELLED' || booking.status === 'EXPIRED') return 'status-muted';
    return booking.status === 'PENDING_PAYMENT' ? 'status-pending' : 'status-good';
  }
  paymentLabel(status: string | undefined): string { return (status || 'PENDING').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase()); }
  cancel(booking: Booking): void {
    if (!confirm(`Cancel booking #${booking.id}? If payment was captured, a refund will be requested.`)) return;
    this.api.cancelMyBooking(booking.id).subscribe({ next: updated => { this.bookings = this.bookings.map(row => row.id === updated.id ? updated : row); }, error: err => this.error = errorMessage(err) });
  }
  pay(booking: Booking): void {
    if (!this.auth.user) return;
    this.payingId = booking.id;
    openCheckout(booking, this.auth.user, this.api, busy => { if (!busy) this.payingId = null; },
      () => { this.payingId = null; this.paidNotice = true; this.load(); },
      message => { this.payingId = null; this.error = message; });
  }
}
