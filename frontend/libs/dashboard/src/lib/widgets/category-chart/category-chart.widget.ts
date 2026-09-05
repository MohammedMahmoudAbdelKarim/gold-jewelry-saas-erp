import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-category-chart-widget',
  imports: [NgApexchartsModule, DashboardWidget, TranslatePipe],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.CATEGORY_CHART">
      <!-- Chart Filter Controls -->
      <div class="chart-controls">
        <span class="control-title">{{ 'DASHBOARD.CATEGORY_CHART' | translate }}</span>
        <div class="filter-buttons">
          <button type="button" [class.active]="activeFilter() === 'month'" (click)="setFilter('month')">{{ 'DASHBOARD.FILTER_MONTH_LABEL' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === 'year'" (click)="setFilter('year')">{{ 'DASHBOARD.FILTER_YEAR_LABEL' | translate }}</button>
        </div>
      </div>

      @defer (on viewport) {
        @if (chartOptions(); as options) {
          <apx-chart
            [series]="options.series"
            [chart]="options.chart"
            [labels]="options.labels"
            [colors]="options.colors"
            [legend]="options.legend"
            [dataLabels]="options.dataLabels"
            [theme]="options.theme"
          />
        }
      } @placeholder {
        <div class="chart-placeholder"><i class="pi pi-spin pi-spinner"></i></div>
      }
    </app-dashboard-widget>
  `,
  styles: `
    .chart-placeholder { height: 220px; display:flex; align-items:center; justify-content:center; color: var(--color-primary); }
    .chart-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(205, 156, 32, 0.1);
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .control-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #CD9C20;
    }
    .filter-buttons {
      display: flex;
      gap: 0.2rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 2px;
      border-radius: 6px;
      border: 1px solid rgba(205, 156, 32, 0.15);
      flex-wrap: wrap;
    }
    .filter-buttons button {
      background: transparent;
      border: none;
      color: rgba(242, 236, 221, 0.5);
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.25rem 0.55rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-buttons button:hover {
      color: #F2ECDD;
    }
    .filter-buttons button.active {
      background: #CD9C20;
      color: #0B0B0B;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChartWidget {
  private store = inject(DashboardStore);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  private translateLoaded = signal<number>(0);
  activeFilter = signal<'month' | 'year'>('month');

  readonly historicalCategories = {
    month: [
      { labelKey: 'DASHBOARD.CAT_RINGS', value: 35 },
      { labelKey: 'DASHBOARD.CAT_CHAINS', value: 25 },
      { labelKey: 'DASHBOARD.CAT_BRACELETS', value: 18 },
      { labelKey: 'DASHBOARD.CAT_COINS', value: 12 },
      { labelKey: 'DASHBOARD.CAT_BARS', value: 10 }
    ],
    year: [
      { labelKey: 'DASHBOARD.CAT_RINGS', value: 42 },
      { labelKey: 'DASHBOARD.CAT_CHAINS', value: 21 },
      { labelKey: 'DASHBOARD.CAT_BRACELETS', value: 15 },
      { labelKey: 'DASHBOARD.CAT_COINS', value: 14 },
      { labelKey: 'DASHBOARD.CAT_BARS', value: 8 }
    ]
  };

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.translateLoaded.update((n) => n + 1);
    });
  }

  chartOptions = computed(() => {
    this.languageService.currentLanguage();
    this.translateLoaded();
    const filter = this.activeFilter();
    const categories = this.historicalCategories[filter];
    if (!categories.length) return null;
    return {
      series: categories.map((c) => c.value),
      labels: categories.map((c) => this.translate.instant(c.labelKey)),
      chart: { type: 'pie' as const, height: 220, background: 'transparent', fontFamily: 'var(--font-family-base)' },
      colors: ['#d4af37', '#f1c40f', '#b8860b', '#8a8a8a', '#4ade80'],
      legend: { position: 'bottom' as const, labels: { colors: '#8a8a8a' }, fontSize: '11px' },
      dataLabels: { enabled: false },
      theme: { mode: 'dark' as const },
    };
  });

  setFilter(filter: 'month' | 'year') {
    this.activeFilter.set(filter);
  }
}
