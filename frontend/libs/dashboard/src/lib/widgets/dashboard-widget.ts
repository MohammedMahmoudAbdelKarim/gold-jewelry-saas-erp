import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard-widget',
  imports: [TranslatePipe],
  template: `
    <section class="dashboard-widget card-premium h-100">
      @if (titleKey()) {
        <header class="widget-header">
          <h3>{{ titleKey() | translate }}</h3>
          <ng-content select="[widget-actions]" />
        </header>
      }
      <div class="widget-body">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    .dashboard-widget {
      padding: 1.15rem;
      margin: 0;
    }
    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
      gap: 0.5rem;
    }
    h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .widget-body {
      min-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWidget {
  titleKey = input<string>('');
}
