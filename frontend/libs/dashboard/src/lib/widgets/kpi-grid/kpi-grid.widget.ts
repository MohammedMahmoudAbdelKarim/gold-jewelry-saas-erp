import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KpiCard } from '../kpi-card/kpi-card';
import { DashboardStore } from '../../store/dashboard.store';

@Component({
  selector: 'app-kpi-grid-widget',
  imports: [KpiCard],
  template: `
    <div class="kpi-grid">
      @for (metric of store.kpis(); track metric.id) {
        <app-kpi-card [metric]="metric" />
      }
    </div>
  `,
  styles: `
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
    }
    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 992px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 576px) { .kpi-grid { grid-template-columns: 1fr; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiGridWidget {
  protected store = inject(DashboardStore);
}
