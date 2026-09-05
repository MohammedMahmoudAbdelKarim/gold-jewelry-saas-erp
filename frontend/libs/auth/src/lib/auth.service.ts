import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  permissions?: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  avatarUrl: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly tokenKey = 'aurum_access_token';
  private readonly userKey = 'aurum_user_data';
  private readonly profileKey = 'aurum_user_profile';

  // Signals for reactive state
  public currentUser = signal<User | null>(this.getStoredUser());
  public isAuthenticated = signal<boolean>(this.hasValidStoredToken());
  public userProfile = signal<UserProfile | null>(this.getStoredProfile());

  constructor() {
    // A stale/expired token left over from a previous session should not appear "logged in".
    if (!this.hasValidStoredToken() && this.getStoredToken()) {
      this.logout();
    }
  }

  login(email: string, password: string, tenantId: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, password, tenantId })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.tokenKey, res.accessToken);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          // Save tenantId for the interceptor
          localStorage.setItem('aurum_tenant_id', tenantId);

          this.currentUser.set(res.user);
          this.isAuthenticated.set(true);

          // Initialize/load profile from storage if available
          this.userProfile.set(this.getStoredProfile());
        })
      );
  }

  register(name: string, email: string, password: string, tenantId: string, role?: string): Observable<any> {
    return this.http.post('/api/auth/register', { name, email, password, tenantId, role });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('aurum_tenant_id');
    localStorage.removeItem(this.profileKey);

    this.currentUser.set(null);
    this.userProfile.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getTenantId(): string | null {
    return localStorage.getItem('aurum_tenant_id') || 'e1a7b445-568d-4e96-a1ad-4672bb192bb3';
  }

  updateProfile(profile: UserProfile) {
    localStorage.setItem(this.profileKey, JSON.stringify(profile));
    this.userProfile.set(profile);

    const currentUser = this.currentUser();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        name: profile.name,
        email: profile.email
      };
      this.currentUser.set(updatedUser);
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    }
  }

  getUserRoleKey(role?: string): string {
    if (!role) return 'DASHBOARD.ROLE_OWNER';
    const r = role.toLowerCase();
    if (r.includes('sales')) return 'DASHBOARD.ROLE_SALES';
    if (r.includes('inventory')) return 'DASHBOARD.ROLE_INVENTORY';
    if (r.includes('accountant') || r.includes('accounting')) return 'DASHBOARD.ROLE_ACCOUNTANT';
    if (r.includes('owner') || r.includes('admin')) return 'DASHBOARD.ROLE_OWNER';
    return 'DASHBOARD.ROLE_OWNER';
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /** Decodes a JWT's payload without verifying its signature (verification is the backend's job). */
  private decodeTokenPayload(token: string): { exp?: number } | null {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  }

  private hasValidStoredToken(): boolean {
    const token = this.getStoredToken();
    return !!token && !this.isTokenExpired(token);
  }

  private getStoredUser(): User | null {
    const data = localStorage.getItem(this.userKey);
    if (!data) return null;
    try {
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  }

  private getStoredProfile(): UserProfile | null {
    const data = localStorage.getItem(this.profileKey);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  }
}
