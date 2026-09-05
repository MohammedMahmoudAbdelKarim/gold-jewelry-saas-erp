import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-pending-tasks-widget',
  imports: [RouterModule, TranslatePipe, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.PENDING_TASKS">
      <div class="tasks-grid">
        @for (task of store.pendingTasks(); track task.id) {
          <a class="task-card" [routerLink]="task.route">
            <span class="task-icon"><i class="pi" [class]="task.icon"></i></span>
            <div>
              <strong>{{ task.labelKey | translate }}</strong>
              <small>{{ task.count }} {{ 'DASHBOARD.PENDING' | translate }}</small>
            </div>
          </a>
        }
      </div>
    </app-dashboard-widget>
  `,
  styles: `
    .tasks-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .task-card {
      display: flex; gap: 0.65rem; align-items: center;
      padding: 0.65rem; border-radius: var(--border-radius-md);
      border: 1px solid rgba(212,175,55,0.12); text-decoration: none; color: inherit;
      background: rgba(212,175,55,0.04); transition: var(--transition-smooth);
    }
    .task-card:hover { border-color: rgba(212,175,55,0.35); color: var(--color-primary); }
    .task-icon { color: var(--color-primary); font-size: 1rem; }
    strong, small { display: block; font-size: 0.8rem; }
    small { color: var(--color-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingTasksWidget {
  protected store = inject(DashboardStore);
}
