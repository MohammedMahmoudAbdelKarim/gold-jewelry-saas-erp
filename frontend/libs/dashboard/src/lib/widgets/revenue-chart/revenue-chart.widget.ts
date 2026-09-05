import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-revenue-chart-widget',
  imports: [NgApexchartsModule, DashboardWidget, TranslatePipe],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.REVENUE_CHART">
      <!-- Chart Filter Controls -->
      <div class="chart-controls">
        <span class="control-title">{{ 'DASHBOARD.REVENUE_TREND' | translate }}</span>
        <div class="filter-buttons">
          <button type="button" [class.active]="activeFilter() === '3m'" (click)="setFilter('3m')">{{ 'DASHBOARD.FILTER_3M' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === '6m'" (click)="setFilter('6m')">{{ 'DASHBOARD.FILTER_6M' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === 'year'" (click)="setFilter('year')">{{ 'DASHBOARD.FILTER_YEAR' | translate }}</button>
        </div>
      </div>

      @defer (on viewport) {
        @if (chartOptions(); as options) {
          <apx-chart
            [series]="options.series"
            [chart]="options.chart"
            [xaxis]="options.xaxis"
            [yaxis]="options.yaxis"
            [colors]="options.colors"
            [plotOptions]="options.plotOptions"
            [dataLabels]="options.dataLabels"
            [grid]="options.grid"
            [legend]="options.legend"
            [theme]="options.theme"
            [tooltip]="options.tooltip"
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
export class RevenueChartWidget {
  private store = inject(DashboardStore);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  private translateLoaded = signal<number>(0);
  activeFilter = signal<'3m' | '6m' | 'year'>('6m');

  readonly historicalRevenue = {
    '3m': [
      { label: 'Apr', revenue: 960000, profit: 260000, expenses: 155000 },
      { label: 'May', revenue: 1020000, profit: 285000, expenses: 162000 },
      { label: 'Jun', revenue: 990000, profit: 270000, expenses: 158000 },
    ],
    '6m': [
      { label: 'Jan', revenue: 820000, profit: 210000, expenses: 140000 },
      { label: 'Feb', revenue: 910000, profit: 240000, expenses: 150000 },
      { label: 'Mar', revenue: 880000, profit: 225000, expenses: 148000 },
      { label: 'Apr', revenue: 960000, profit: 260000, expenses: 155000 },
      { label: 'May', revenue: 1020000, profit: 285000, expenses: 162000 },
      { label: 'Jun', revenue: 990000, profit: 270000, expenses: 158000 },
    ],
    year: [
      { label: 'Jul', revenue: 780000, profit: 195000, expenses: 135000 },
      { label: 'Aug', revenue: 810000, profit: 205000, expenses: 142000 },
      { label: 'Sep', revenue: 850000, profit: 220000, expenses: 145000 },
      { label: 'Oct', revenue: 920000, profit: 245000, expenses: 150000 },
      { label: 'Nov', revenue: 880000, profit: 230000, expenses: 147000 },
      { label: 'Dec', revenue: 950000, profit: 255000, expenses: 152000 },
      { label: 'Jan', revenue: 820000, profit: 210000, expenses: 140000 },
      { label: 'Feb', revenue: 910000, profit: 240000, expenses: 150000 },
      { label: 'Mar', revenue: 880000, profit: 225000, expenses: 148000 },
      { label: 'Apr', revenue: 960000, profit: 260000, expenses: 155000 },
      { label: 'May', revenue: 1020000, profit: 285000, expenses: 162000 },
      { label: 'Jun', revenue: 990000, profit: 270000, expenses: 158000 },
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
    const points = this.historicalRevenue[filter];
    const egpLabel = this.translate.instant('DASHBOARD.CURRENCY_EGP');
    return {
      series: [
        { name: this.translate.instant('DASHBOARD.REVENUE_LABEL'), data: points.map((p) => p.revenue) },
        { name: this.translate.instant('DASHBOARD.PROFIT_LABEL'), data: points.map((p) => p.profit) },
        { name: this.translate.instant('DASHBOARD.EXPENSES_LABEL'), data: points.map((p) => p.expenses) },
      ],
      chart: { type: 'bar' as const, height: 220, background: 'transparent', toolbar: { show: false }, fontFamily: 'var(--font-family-base)' },
      colors: ['#d4af37', '#4ade80', '#f87171'],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
      dataLabels: { enabled: false },
      xaxis: { categories: points.map((p) => this.translate.instant('DASHBOARD.' + p.label.toUpperCase())), labels: { style: { colors: '#8a8a8a' } } },
      yaxis: {
        labels: {
          style: { colors: '#8a8a8a' },
          formatter: (val: number) => `${val.toLocaleString()} ${egpLabel}`
        }
      },
      grid: { borderColor: 'rgba(212,175,55,0.08)' },
      legend: { labels: { colors: '#8a8a8a' }, fontSize: '11px' },
      theme: { mode: 'dark' as const },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => `${val.toLocaleString()} ${egpLabel}`
        }
      }
    };
  });

  setFilter(filter: '3m' | '6m' | 'year') {
    this.activeFilter.set(filter);
  }
}
