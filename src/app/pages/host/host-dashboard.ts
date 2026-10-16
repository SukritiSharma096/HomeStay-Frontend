import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Booking, Property } from '../../core/models';
import { errorMessage, mainImage } from '../../core/util';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container section host-studio">
      <div class="page-head">
        <div><p class="eyebrow">HOST STUDIO</p><h1>Your stays, all together</h1><p class="muted">Manage your listings, availability and guest arrivals.</p></div>
        <a routerLink="/host/property/new" class="btn btn-dark">+ Add a stay</a>
      </div>

      <div class="host-stats"><div><span>Your listings</span><strong>{{ properties.length }}</strong></div><div><span>Live stays</span><strong>{{ liveCount }}</strong></div><div><span>Awaiting approval</span><strong>{{ pendingCount }}</strong></div><div><span>Bookings</span><strong>{{ bookings.length }}</strong></div></div>

      <div class="host-verification-banner" *ngIf="auth.user?.hostVerificationStatus === 'PENDING' || auth.user?.hostVerificationStatus === 'REJECTED'"><span>◷</span><div><strong>{{ auth.user?.hostVerificationStatus === 'REJECTED' ? 'Host verification needs attention' : 'Host account verification pending' }}</strong><small>{{ auth.user?.hostVerificationStatus === 'REJECTED' ? 'Contact support to understand the next steps. New listings need a verified host before approval.' : 'Our team reviews host accounts and new listings. Your properties will appear to guests after approval.' }}</small></div><a routerLink="/support">Contact support →</a></div>
      <div class="alert alert-error" *ngIf="error">{{ error }}</div>

      <p class="muted" *ngIf="loading">Loading...</p>

      <ng-container *ngIf="!loading">
        <div class="empty" *ngIf="!properties.length">
          <p>You have not added any property yet.</p>
          <a routerLink="/host/property/new" class="btn btn-primary">Add your first property</a>
        </div>

        <div class="list" *ngIf="properties.length">
          <div class="list-item" *ngFor="let p of properties">
            <div class="thumb">
              <img *ngIf="image(p) as src; else noImg" [src]="src" [alt]="p.name" />
              <ng-template #noImg><div class="no-img small">No photo</div></ng-template>
            </div>
            <div class="list-info">
              <h3>{{ p.name }}</h3>
              <p class="muted">
                {{ p.destinationName }} · {{ p.propertyType }} · ₹{{
                  p.pricePerNight | number: '1.0-0'
                }}
                / night
              </p>
              <span class="status-pill" [ngClass]="p.status === 'APPROVED' && p.active ? 'status-good' : p.status === 'REJECTED' || p.status === 'SUSPENDED' ? 'status-muted' : 'status-pending'">{{ p.status || (p.active ? 'APPROVED' : 'PENDING') }}</span>
              <small class="muted" *ngIf="p.status === 'PENDING'">Your listing is waiting for admin review.</small>
              <small class="table-note" *ngIf="p.reviewNote">{{ p.reviewNote }}</small>
            </div>
            <div class="list-actions">
              <a [routerLink]="p.status === 'APPROVED' && p.active ? ['/property', p.id] : ['/host/property', p.id, 'edit']" class="btn btn-outline btn-sm">View</a>
              <a [routerLink]="['/host/property', p.id, 'edit']" class="btn btn-primary btn-sm"
                >Edit</a
              >
              <button type="button" class="btn btn-danger btn-sm" (click)="remove(p)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <section class="host-bookings panel"><div class="panel-head"><div><p class="eyebrow">GUEST ARRIVALS</p><h2>Bookings for your stays</h2></div><button class="btn btn-outline btn-sm" (click)="loadBookings()">Refresh</button></div><p class="muted" *ngIf="bookingLoading">Loading guest bookings…</p><div class="table-wrap" *ngIf="!bookingLoading"><table><thead><tr><th>Stay</th><th>Guest</th><th>Dates</th><th>Payment</th><th>Amount</th></tr></thead><tbody><tr *ngFor="let b of bookings"><td><strong>{{ b.propertyName }}</strong><small>Booking #{{ b.id }}</small></td><td>{{ b.customerName }}<small>{{ b.customerEmail }}</small></td><td>{{ b.checkIn | date:'d MMM yyyy' }} – {{ b.checkOut | date:'d MMM yyyy' }}<small>{{ b.guests }} guests · {{ b.rooms || 1 }} rooms</small></td><td><span class="status-pill" [ngClass]="b.paymentStatus === 'PAID' ? 'status-good' : 'status-pending'">{{ b.status }}</span></td><td><strong>₹{{ b.hostEarnings | number:'1.0-0' }}</strong><small>estimated host share</small></td></tr><tr *ngIf="!bookings.length"><td colspan="5" class="table-empty">Guest bookings will appear here.</td></tr></tbody></table></div></section>
    </div>
  `,
})
export class HostDashboardPage {
  private api = inject(ApiService);
  auth = inject(AuthService);

  properties: Property[] = [];
  bookings: Booking[] = [];
  bookingLoading = true;
  loading = true;
  error = '';

  constructor() {
    this.api.getMyProperties().subscribe({
      next: (list) => {
        this.properties = list;
        this.loading = false;
      },
      error: (err) => {
        this.error = errorMessage(err);
        this.loading = false;
      },
    });
    this.loadBookings();
  }

  get liveCount(): number { return this.properties.filter(p => p.status === 'APPROVED' && p.active).length; }
  get pendingCount(): number { return this.properties.filter(p => !p.status || p.status === 'PENDING').length; }
  loadBookings(): void {
    this.bookingLoading = true;
    this.api.getHostBookings().subscribe({ next: rows => { this.bookings = rows; this.bookingLoading = false; }, error: err => { this.bookingLoading = false; if (!this.error) this.error = errorMessage(err); } });
  }

  image(p: Property): string | null {
    return mainImage(p);
  }

  remove(p: Property): void {
    if (!confirm(`Delete "${p.name}"? Its photos will be deleted too.`)) {
      return;
    }
    this.error = '';
    this.api.deleteProperty(p.id).subscribe({
      next: () => (this.properties = this.properties.filter((x) => x.id !== p.id)),
      error: (err) => (this.error = errorMessage(err)),
    });
  }
}
