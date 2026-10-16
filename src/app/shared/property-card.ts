import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Params, RouterLink } from '@angular/router';
import { Property } from '../core/models';
import { mainImage } from '../core/util';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a class="card property-card" [routerLink]="['/property', property.id]" [queryParams]="dates">
      <div class="card-img">
        <img *ngIf="img as src; else noImg" [src]="src" [alt]="property.name" loading="lazy" />
        <ng-template #noImg><div class="no-img">No photo yet</div></ng-template>
        <span class="badge">{{ property.propertyType }}</span>
      </div>
      <div class="card-body">
        <h3>{{ property.name }}</h3>
        <p class="muted">📍 {{ property.destinationName }}</p>
        <p class="muted small">
          👥 {{ property.maxGuests }} guests / room · 🛏 {{ property.bedrooms }} bedrooms · 🚿
          {{ property.bathrooms }} bath
        </p>
        <div class="card-foot">
          <span class="price"
            >₹{{ property.pricePerNight | number: '1.0-0' }} <small>/ night</small></span
          >
          <span class="rating" *ngIf="property.rating"
            >★ {{ property.rating | number: '1.1-1' }}</span
          >
        </div>
      </div>
    </a>
  `,
})
export class PropertyCard {
  @Input() property!: Property;
  @Input() dates: Params = {};

  get img(): string | null {
    return mainImage(this.property);
  }
}
