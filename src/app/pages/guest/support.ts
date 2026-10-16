import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Booking, SupportTicket } from '../../core/models';
import { errorMessage } from '../../core/util';

@Component({
  selector: 'app-support', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <section class="container section support-layout"><div><p class="eyebrow">HERE WHEN YOU NEED US</p><h1>How can we help?</h1><p class="muted">Send a note to our team. We’ll keep your request and reply here.</p><div class="support-note"><span>✦</span><div><strong>Real people, thoughtful help</strong><small>Share your booking question or tell us what went wrong.</small></div></div><article class="support-ticket" *ngFor="let ticket of tickets"><div class="ticket-meta"><span class="status-pill" [ngClass]="ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'status-good' : 'status-pending'">{{ ticket.status }}</span><small>{{ ticket.createdAt | date:'mediumDate' }}</small></div><h3>{{ ticket.subject }}</h3><p>{{ ticket.message }}</p><div class="admin-reply" *ngIf="ticket.adminReply"><strong>Reply from Havenstay</strong><p>{{ ticket.adminReply }}</p></div></article><p class="muted" *ngIf="!loading && !tickets.length">Your support requests will show up here.</p></div>
      <form class="support-form" (ngSubmit)="submit()"><p class="eyebrow">CONTACT SUPPORT</p><h2>Tell us what’s up</h2><div class="alert alert-error" *ngIf="error">{{ error }}</div><div class="alert alert-success" *ngIf="notice">{{ notice }}</div><label class="field"><span>Related booking <small>(optional)</small></span><select [(ngModel)]="bookingId" name="bookingId"><option value="">General question</option><option *ngFor="let b of bookings" [value]="b.id">#{{ b.id }} · {{ b.propertyName }} · {{ b.checkIn }}</option></select></label><label class="field"><span>Subject</span><input [(ngModel)]="subject" name="subject" required minlength="4" maxlength="160" placeholder="What do you need help with?"></label><label class="field"><span>Message</span><textarea [(ngModel)]="message" name="message" required minlength="10" maxlength="5000" rows="6" placeholder="Tell us a little more so we can help…"></textarea></label><button class="btn btn-dark btn-block" [disabled]="saving">{{ saving ? 'Sending…' : 'Send to support' }}</button><small class="muted">Please don’t include your password or card details.</small></form>
    </section>
  `,
})
export class SupportPage {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  tickets: SupportTicket[] = [];
  bookings: Booking[] = [];
  subject = '';
  message = '';
  bookingId = '';
  error = '';
  notice = '';
  loading = true;
  saving = false;
  constructor() {
    this.bookingId = this.route.snapshot.queryParamMap.get('bookingId') || '';
    this.api.getMyTickets().subscribe({ next: rows => { this.tickets = rows; this.loading = false; }, error: () => this.loading = false });
    this.api.getMyBookings().subscribe({ next: rows => this.bookings = rows, error: () => this.bookings = [] });
  }
  submit(): void {
    this.error = ''; this.notice = '';
    if (this.subject.trim().length < 4 || this.message.trim().length < 10) { this.error = 'Add a subject and a message with at least 10 characters.'; return; }
    this.saving = true;
    this.api.createTicket({ bookingId: this.bookingId ? Number(this.bookingId) : null, subject: this.subject.trim(), message: this.message.trim() }).subscribe({
      next: ticket => { this.tickets = [ticket, ...this.tickets]; this.subject = ''; this.message = ''; this.bookingId = ''; this.saving = false; this.notice = 'Your request has been sent. We’ll reply here.'; },
      error: err => { this.error = errorMessage(err); this.saving = false; },
    });
  }
}
