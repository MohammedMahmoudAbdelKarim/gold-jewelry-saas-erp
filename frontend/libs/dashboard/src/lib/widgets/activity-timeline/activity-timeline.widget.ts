import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-activity-timeline-widget',
  imports: [TranslatePipe, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.RECENT_ACTIVITY">
      <ul class="timeline">
        @for (item of store.activities(); track item.id) {
          <li>
            <span class="dot"></span>
            <div>
              <p>{{ item.messageKey | translate:{ actor: item.actor } }}</p>
              <small>{{ item.timeKey | translate }}</small>
            </div>
          </li>
        }
      </ul>
    </app-dashboard-widget>
  `,
  styles: `
    .timeline { list-style: none; margin: 0; padding: 0; max-height: 220px; overflow-y: auto; }
    li { display: flex; gap: 0.65rem; padding: 0.5rem 0; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); margin-top: 0.35rem; flex-shrink: 0; }
    p, small { margin: 0; font-size: 0.8rem; }
    p { color: var(--color-text); }
    small { color: var(--color-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTimelineWidget {
  protected store = inject(DashboardStore);
}
