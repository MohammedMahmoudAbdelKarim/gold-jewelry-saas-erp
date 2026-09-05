import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-dashboard-notifications-widget',
  imports: [TranslatePipe, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.NOTIFICATIONS">
      <ul class="notif-list">
        @for (item of store.notifications(); track item.id) {
          <li [class.unread]="item.unread">
            <strong>{{ item.titleKey | translate }}</strong>
            <p>{{ item.messageKey | translate }}</p>
            <small>{{ item.timeKey | translate }}</small>
          </li>
        }
      </ul>
    </app-dashboard-widget>
  `,
  styles: `
    .notif-list { list-style: none; margin: 0; padding: 0; max-height: 220px; overflow-y: auto; }
    li { padding: 0.6rem 0; border-bottom: 1px solid rgba(212,175,55,0.08); }
    li.unread { border-inline-start: 2px solid var(--color-primary); padding-inline-start: 0.5rem; }
    strong, p, small { display: block; margin: 0; font-size: 0.8rem; }
    p { color: var(--color-text-muted); margin: 0.15rem 0; }
    small { color: var(--color-primary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardNotificationsWidget {
  protected store = inject(DashboardStore);
}
