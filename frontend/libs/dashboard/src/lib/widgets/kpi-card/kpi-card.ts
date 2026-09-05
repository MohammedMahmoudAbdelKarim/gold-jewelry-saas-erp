import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { KpiMetric } from '../../models/dashboard.models';

@Component({
  selector: 'app-kpi-card',
  imports: [RouterModule, TranslatePipe],
  template: `
    <a class="kpi-card" [routerLink]="metric().route ?? '/'" [class.trend-up]="metric().trend === 'up'" [class.trend-down]="metric().trend === 'down'">
      <div class="kpi-top">
        <span class="kpi-icon"><i class="pi" [class]="metric().icon"></i></span>
        <span class="kpi-trend">
          @if (metric().trend === 'up') { <i class="pi pi-arrow-up"></i> }
          @else if (metric().trend === 'down') { <i class="pi pi-arrow-down"></i> }
          @else { <i class="pi pi-minus"></i> }
          {{ metric().trendValue }}
        </span>
      </div>
      <p class="kpi-label">{{ metric().labelKey | translate }}</p>
      <strong class="kpi-value">{{ metric().value }}</strong>
      <small class="kpi-compare">{{ metric().comparisonKey | translate }}</small>
    </a>
  `,
  styleUrl: './kpi-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  metric = input.required<KpiMetric>();
}
