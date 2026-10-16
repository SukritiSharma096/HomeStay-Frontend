import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from './config';
import { AuthResponse, AuthUser } from './models';

const STORAGE_KEY = 'homestay_session';

interface Session {
  token: string;
  expiresAt: number;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private session: Session | null = this.load();

  get user(): AuthUser | null {
    const s = this.session;
    return s && s.expiresAt > Date.now() ? s.user : null;
  }

  get isLoggedIn(): boolean {
    return this.user !== null;
  }

  get token(): string | null {
    const s = this.session;
    return s && s.expiresAt > Date.now() ? s.token : null;
  }

  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, body)
      .pipe(tap((res) => this.save(res)));
  }

  register(body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'GUEST' | 'HOST';
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, body)
      .pipe(tap((res) => this.save(res)));
  }

  logout(redirect = true): void {
    this.session = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage not available - ignore
    }
    if (redirect) {
      this.router.navigate(['/']);
    }
  }

  updateUser(user: AuthUser): void { if (!this.session) return; this.save({ accessToken: this.session.token, tokenType: 'Bearer', expiresIn: Math.max(1, Math.floor((this.session.expiresAt - Date.now()) / 1000)), user }); }

  private save(res: AuthResponse): void {
    this.session = {
      token: res.accessToken,
      expiresAt: Date.now() + res.expiresIn * 1000,
      user: res.user,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
    } catch {
      // storage not available - session lives in memory only
    }
  }

  private load(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
