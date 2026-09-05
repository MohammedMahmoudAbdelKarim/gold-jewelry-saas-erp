import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardRole, RoleService } from '@frontend/core';
import { DashboardStore } from '../../store/dashboard.store';

@Component({
  selector: 'app-dashboard-header',
  imports: [TranslatePipe],
  template: `
    <header class="dashboard-header">
      <div>
        <h2 class="page-title"><i class="pi pi-home"></i>{{ 'DASHBOARD.TITLE' | translate }}</h2>
        <p class="page-subtitle">{{ 'DASHBOARD.SUBTITLE' | translate }}</p>
      </div>
      <div class="header-actions">
        <button type="button" class="refresh-btn" (click)="store.refresh()" [disabled]="store.isRefreshing()">
          <i class="pi" [class.pi-refresh]="!store.isRefreshing()" [class.pi-spin]="store.isRefreshing()" [class.pi-spinner]="store.isRefreshing()"></i>
          {{ 'DASHBOARD.REFRESH' | translate }}
        </button>
      </div>
    </header>
  `,
  styleUrl: './dashboard-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeader {
  protected roleService = inject(RoleService);
  protected store = inject(DashboardStore);
  protected readonly roles: DashboardRole[] = ['owner', 'sales', 'inventory', 'accountant'];

  onRoleChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as DashboardRole;
    this.roleService.setRole(value);
  }
}
