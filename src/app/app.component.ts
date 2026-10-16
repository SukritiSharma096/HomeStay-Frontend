import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="site-nav">
      <div class="nav-shell">
        <button *ngIf="router.url !== '/'" type="button" class="global-back" (click)="goBack()">← <span>Back</span></button>
        <a routerLink="/" class="brand"><span class="brand-mark">h</span><span>haven<span class="brand-light">stay</span><small>LOCAL HOMES, WARM WELCOMES</small></span></a>
        <nav class="nav-links">
          <a routerLink="/search" routerLinkActive="nav-active">Explore</a>
          <ng-container *ngIf="auth.user as user">
            <a *ngIf="user.role === 'GUEST'" routerLink="/my-bookings" routerLinkActive="nav-active">My trips</a>
            <a *ngIf="user.role === 'HOST'" routerLink="/host" routerLinkActive="nav-active">Host studio</a>
            <a *ngIf="user.role === 'GUEST' || user.role === 'HOST'" routerLink="/profile" routerLinkActive="nav-active">Profile</a>
            <a *ngIf="user.role === 'ADMIN'" routerLink="/admin" routerLinkActive="nav-active">Admin console</a>
            <a *ngIf="user.role !== 'ADMIN'" routerLink="/support" routerLinkActive="nav-active">Help</a>
            <span class="nav-user">{{ user.fullName.split(' ')[0] }}</span>
            <button type="button" class="btn btn-dark btn-sm" (click)="auth.logout()">Sign out</button>
          </ng-container>
          <ng-container *ngIf="!auth.user">
            <a routerLink="/login" routerLinkActive="nav-active">Sign in</a>
            <a routerLink="/register" class="btn btn-dark btn-sm">Join / List a stay</a>
          </ng-container>
        </nav>
      </div>
    </header>
    <main><router-outlet></router-outlet></main>
    <footer class="site-footer"><div><a routerLink="/" class="footer-brand">havenstay</a><span>Thoughtful stays, hosted locally.</span></div><small>© {{ year }} Havenstay · Built for better getaways</small></footer>
  `,
})
export class AppComponent {
  auth = inject(AuthService);
  router = inject(Router);
  private location = inject(Location);
  year = new Date().getFullYear();
  goBack(): void {
    const navigationId = Number(window.history.state?.navigationId || 0);
    if (navigationId > 1) this.location.back();
    else this.router.navigateByUrl(this.router.url.startsWith('/host/property') ? '/host' : this.router.url.startsWith('/property') ? '/search' : '/');
  }
}
