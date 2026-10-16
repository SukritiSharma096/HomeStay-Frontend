import { Routes } from '@angular/router';
import { roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', title: 'Homestay · find your place', loadComponent: () => import('./pages/home/home').then(m => m.HomePage) },
  { path: 'search', title: 'Explore stays', loadComponent: () => import('./pages/search/search').then(m => m.SearchPage) },
  { path: 'property/:id', title: 'Stay details', loadComponent: () => import('./pages/property/property-detail').then(m => m.PropertyDetailPage) },
  { path: 'login', title: 'Sign in', loadComponent: () => import('./pages/auth/login').then(m => m.LoginPage) },
  { path: 'register', title: 'Create account', loadComponent: () => import('./pages/auth/register').then(m => m.RegisterPage) },
  { path: 'my-bookings', title: 'My trips', canActivate: [roleGuard], data: { roles: ['GUEST'] }, loadComponent: () => import('./pages/guest/my-bookings').then(m => m.MyBookingsPage) },
  { path: 'support', title: 'Help and support', canActivate: [roleGuard], data: { roles: ['GUEST', 'HOST'] }, loadComponent: () => import('./pages/guest/support').then(m => m.SupportPage) },
  { path: 'profile', title: 'My profile', canActivate: [roleGuard], data: { roles: ['GUEST', 'HOST'] }, loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePage) },
  { path: 'host', title: 'Host dashboard', canActivate: [roleGuard], data: { roles: ['HOST'] }, loadComponent: () => import('./pages/host/host-dashboard').then(m => m.HostDashboardPage) },
  { path: 'host/property/new', title: 'Add a stay', canActivate: [roleGuard], data: { roles: ['HOST'] }, loadComponent: () => import('./pages/host/property-form').then(m => m.PropertyFormPage) },
  { path: 'host/property/:id/edit', title: 'Edit a stay', canActivate: [roleGuard], data: { roles: ['HOST'] }, loadComponent: () => import('./pages/host/property-form').then(m => m.PropertyFormPage) },
  { path: 'admin', title: 'Admin console', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./pages/admin/admin-dashboard').then(m => m.AdminDashboardPage) },
  { path: '**', redirectTo: '' },
];
