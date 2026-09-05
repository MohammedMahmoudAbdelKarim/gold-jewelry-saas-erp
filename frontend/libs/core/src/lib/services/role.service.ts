import { Injectable, signal } from '@angular/core';
import { DashboardRole } from './role.types';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly storageKey = 'aurum_user_role';

  readonly currentRole = signal<DashboardRole>(this.readRole());

  setRole(role: DashboardRole) {
    this.currentRole.set(role);
    localStorage.setItem(this.storageKey, role);
  }

  private readRole(): DashboardRole {
    const stored = localStorage.getItem(this.storageKey) as DashboardRole | null;
    if (stored && ['owner', 'sales', 'inventory', 'accountant'].includes(stored)) {
      return stored;
    }
    return 'owner';
  }
}
