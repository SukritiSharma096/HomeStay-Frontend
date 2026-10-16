import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

interface Tile { url: string; left: number; top: number; }

@Component({
  selector: 'app-map-picker', standalone: true, imports: [CommonModule],
  styles: [`
    .map-box{position:relative;height:310px;overflow:hidden;border:1px solid #d9ded8;border-radius:14px;background:#e8eee7;cursor:crosshair;isolation:isolate}
    .tile{position:absolute;width:256px;height:256px;max-width:none;user-select:none;pointer-events:none}
    .pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);font-size:30px;color:#b94332;text-shadow:0 1px 3px white;pointer-events:none}
    .map-controls{position:absolute;right:12px;top:12px;display:grid;gap:5px;z-index:2}
    .map-controls button{width:34px;height:34px;border:0;border-radius:8px;background:#fff;font-size:20px;box-shadow:0 1px 5px #0002}
    .attribution{position:absolute;right:4px;bottom:3px;z-index:2;background:#ffffffd9;font-size:10px;padding:2px 5px;color:#333}
    .map-hint{font-size:13px;color:#637167;margin-top:7px}
  `],
  template: `
    <div class="map-box" (click)="pick($event)" role="application" aria-label="Click the map to select property location">
      <img class="tile" *ngFor="let tile of tiles" [src]="tile.url" [style.left.px]="tile.left" [style.top.px]="tile.top" alt="">
      <span class="pin" *ngIf="hasSelection">●</span>
      <div class="map-controls"><button type="button" aria-label="Zoom in" (click)="$event.stopPropagation(); zoomBy(1)">+</button><button type="button" aria-label="Zoom out" (click)="$event.stopPropagation(); zoomBy(-1)">−</button></div>
      <a class="attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" (click)="$event.stopPropagation()">© OpenStreetMap</a>
    </div>
    <div class="map-hint">{{ hasSelection ? 'Selected: ' + latitude?.toFixed(5) + ', ' + longitude?.toFixed(5) : 'Click the map to drop a pin. Use + / − to zoom.' }}</div>
  `,
})
export class MapPicker implements OnChanges {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Output() locationSelected = new EventEmitter<{ latitude: number; longitude: number }>();
  centerLat = 20.5937;
  centerLng = 78.9629;
  zoom = 5;
  hasSelection = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['latitude'] || changes['longitude']) && this.latitude != null && this.longitude != null) {
      this.centerLat = this.latitude; this.centerLng = this.longitude; this.hasSelection = true;
    }
  }

  get tiles(): Tile[] {
    const width = 760, height = 310, tileSize = 256, scale = tileSize * 2 ** this.zoom;
    const xCenter = (this.centerLng + 180) / 360 * scale;
    const sin = Math.sin(this.centerLat * Math.PI / 180);
    const yCenter = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    const leftWorld = xCenter - width / 2, topWorld = yCenter - height / 2;
    const tiles: Tile[] = [];
    for (let y = Math.floor(topWorld / tileSize); y <= Math.floor((topWorld + height) / tileSize); y++) {
      for (let x = Math.floor(leftWorld / tileSize); x <= Math.floor((leftWorld + width) / tileSize); x++) {
        const max = 2 ** this.zoom;
        if (y < 0 || y >= max) continue;
        const wrappedX = ((x % max) + max) % max;
        tiles.push({ url: `https://tile.openstreetmap.org/${this.zoom}/${wrappedX}/${y}.png`, left: x * tileSize - leftWorld, top: y * tileSize - topWorld });
      }
    }
    return tiles;
  }

  pick(event: MouseEvent): void {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const width = bounds.width, height = bounds.height;
    const scale = 256 * 2 ** this.zoom;
    const sin = Math.sin(this.centerLat * Math.PI / 180);
    const x = (this.centerLng + 180) / 360 * scale + (event.clientX - bounds.left - width / 2);
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale + (event.clientY - bounds.top - height / 2);
    const longitude = x / scale * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / scale;
    const latitude = 180 / Math.PI * Math.atan(Math.sinh(n));
    this.centerLat = latitude; this.centerLng = longitude; this.hasSelection = true;
    this.locationSelected.emit({ latitude, longitude });
  }

  zoomBy(delta: number): void { this.zoom = Math.max(3, Math.min(18, this.zoom + delta)); }
}
