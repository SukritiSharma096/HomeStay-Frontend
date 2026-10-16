import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Amenity, Destination, Property } from '../../core/models';
import { PropertyCard } from '../../shared/property-card';
import { SearchForm } from '../../shared/search-form';

@Component({
  selector: 'app-home', standalone: true, imports: [CommonModule, RouterLink, SearchForm, PropertyCard],
  template: `
    <section class="home-hero"><div class="hero-art hero-art-one"></div><div class="hero-art hero-art-two"></div><div class="container hero-inner"><div class="hero-copy"><p class="eyebrow light-eyebrow">STAY A LITTLE CLOSER</p><h1>Find a place<br>that feels like <em>yours.</em></h1><p>Thoughtful homestays, welcoming hosts and the little comforts that make a trip unforgettable.</p><div class="hero-proof"><span>✦ Handpicked homes</span><span>⌂ Hosted with heart</span><span>◷ Flexible dates</span></div></div><div class="hero-search"><app-search-form></app-search-form></div><div class="hero-caption"><span>01 / FIND YOUR PLACE</span><span>GOOD STAYS. GOOD STORIES.</span></div></div></section>
    <section class="container section destination-section"><div class="section-title-row"><div><p class="eyebrow">A CHANGE OF SCENERY</p><h2>Where are you dreaming of?</h2><p class="muted">Start with a place, and find your kind of stay.</p></div><a routerLink="/search" class="text-link">Explore every destination ↗</a></div><div class="destination-grid"><a *ngFor="let d of destinations; let i = index" class="destination-tile" [class.destination-wide]="i === 0" [routerLink]="['/search']" [queryParams]="{ destinationId: d.id }"><img *ngIf="d.imageUrl" [src]="d.imageUrl" [alt]="d.name" loading="lazy"><span class="destination-shade"></span><span class="destination-meta"><strong>{{ d.name }}</strong><small>{{ d.state || d.country || 'India' }} · Explore stays</small></span><span class="destination-arrow">↗</span></a><p class="muted" *ngIf="!destinations.length">Destinations are being added. Search all stays instead.</p></div></section>
    <section class="essentials-band"><div class="container"><div><p class="eyebrow">MAKE IT YOUR KIND OF STAY</p><h2>What matters to you?</h2><p class="muted">Find a place with all the comforts you need.</p></div><div class="essential-chips"><a *ngFor="let amenity of amenityPicks" [routerLink]="['/search']" [queryParams]="{ amenity: amenity.name }"><span>{{ iconFor(amenity.name) }}</span>{{ amenity.name }} <b>→</b></a><span *ngIf="!amenityPicks.length" class="muted small">Choose from homes with kitchens, Wi-Fi, parking and more.</span></div></div></section>
    <section class="container section featured-section"><div class="section-title-row"><div><p class="eyebrow">GOOD HOMES, GOOD HOSTS</p><h2>Stays worth slowing down for</h2><p class="muted">A few lovely places to start your search.</p></div><a routerLink="/search" class="text-link">See all stays ↗</a></div><p class="muted" *ngIf="loading">Gathering lovely stays…</p><div class="grid card-grid" *ngIf="!loading && properties.length"><app-property-card *ngFor="let property of properties" [property]="property"></app-property-card></div><div class="empty-state compact" *ngIf="!loading && !properties.length"><h3>New places are on their way</h3><p class="muted">Our local hosts are getting their homes ready.</p><a routerLink="/search" class="btn btn-soft">Browse destinations</a></div></section>
    <section class="host-invite"><div class="container host-invite-inner"><div><p class="eyebrow light-eyebrow">HAVE A PLACE TO SHARE?</p><h2>Make room for a new story.</h2><p>List your home, manage your calendar and welcome guests on your terms.</p></div><a routerLink="/register" [queryParams]="{ role: 'HOST' }" class="btn btn-light">Become a host <span>↗</span></a></div></section>
  `,
})
export class HomePage {
  private api = inject(ApiService);
  destinations: Destination[] = [];
  amenities: Amenity[] = [];
  properties: Property[] = [];
  loading = true;
  get amenityPicks(): Amenity[] { return this.amenities.slice(0, 6); }
  constructor() {
    this.api.getDestinations().subscribe({ next: list => this.destinations = list.filter(d => d.active !== false).slice(0, 5), error: () => this.destinations = [] });
    this.api.getAmenities().subscribe({ next: list => this.amenities = list.filter(a => a.active !== false), error: () => this.amenities = [] });
    this.api.getProperties().subscribe({ next: list => { this.properties = list.slice(0, 6); this.loading = false; }, error: () => this.loading = false });
  }
  iconFor(name: string): string { const value = name.toLowerCase(); if (value.includes('kitchen')) return '⌑'; if (value.includes('wi') || value.includes('internet')) return '⌁'; if (value.includes('pool')) return '◉'; if (value.includes('parking')) return 'P'; if (value.includes('breakfast')) return '☼'; if (value.includes('pet')) return '♡'; return '✦'; }
}
