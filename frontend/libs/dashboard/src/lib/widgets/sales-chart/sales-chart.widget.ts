import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-sales-chart-widget',
  imports: [NgApexchartsModule, TranslatePipe, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.SALES_CHART">
      <!-- Chart Filter Controls -->
      <div class="chart-controls">
        <span class="control-title">{{ 'DASHBOARD.SALES_TREND' | translate }}</span>
        <div class="filter-buttons">
          <button type="button" [class.active]="activeFilter() === 'day'" (click)="setFilter('day')">{{ 'DASHBOARD.FILTER_DAY' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === 'week'" (click)="setFilter('week')">{{ 'DASHBOARD.FILTER_WEEK' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === 'month'" (click)="setFilter('month')">{{ 'DASHBOARD.FILTER_MONTH' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === '3m'" (click)="setFilter('3m')">{{ 'DASHBOARD.FILTER_3M' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === '6m'" (click)="setFilter('6m')">{{ 'DASHBOARD.FILTER_6M' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === 'year'" (click)="setFilter('year')">{{ 'DASHBOARD.FILTER_YEAR' | translate }}</button>
          <button type="button" [class.active]="activeFilter() === '5y'" (click)="setFilter('5y')">{{ 'DASHBOARD.FILTER_5Y' | translate }}</button>
        </div>
      </div>

      <div class="trend-chart-wrap">
        @defer (on viewport) {
          @if (chartOptions(); as options) {
            <apx-chart
              [series]="options.series"
              [chart]="options.chart"
              [xaxis]="options.xaxis"
              [yaxis]="options.yaxis"
              [colors]="options.colors"
              [stroke]="options.stroke"
              [dataLabels]="options.dataLabels"
              [grid]="options.grid"
              [theme]="options.theme"
              [tooltip]="options.tooltip"
            />
          }
        } @placeholder {
          <div class="chart-placeholder"><i class="pi pi-spin pi-spinner"></i></div>
        }
      </div>
    </app-dashboard-widget>
  `,
  styles: `
    .chart-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
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
      padding: 0.25rem 0.5rem;
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
    .trend-chart-wrap {
      min-height: 220px;
    }
    .chart-placeholder {
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesChartWidget {
  activeFilter = signal<'day' | 'week' | 'month' | '3m' | '6m' | 'year' | '5y'>('month');

  readonly historicalSales: Record<string, { categories: string[], data: number[] }> = {
    day: {
      categories: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      data: [25000, 48000, 62000, 31000, 54000, 75000, 88000, 45000, 32000, 25000] // Sums up to 485,000 EGP (matches KPI card)
    },
    week: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [380000, 410000, 485000, 390000, 520000, 610000, 250000]
    },
    month: {
      categories: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      data: [1200000, 1450000, 1850000, 1680000]
    },
    '3m': {
      categories: ['May', 'Jun', 'Jul'],
      data: [4200000, 5800000, 6200000]
    },
    '6m': {
      categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      data: [3800000, 4100000, 4500000, 4200000, 5800000, 6200000]
    },
    year: {
      categories: ['Aug 25', 'Oct 25', 'Dec 25', 'Feb 26', 'Apr 26', 'Jun 26'],
      data: [8500000, 9200000, 11000000, 9800000, 12000000, 14200000]
    },
    '5y': {
      categories: ['2022', '2023', '2024', '2025', '2026'],
      data: [28000000, 35000000, 48000000, 59000000, 72000000]
    }
  };

  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  private translateLoaded = signal<number>(0);

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.translateLoaded.update((n) => n + 1);
    });
  }

  private getTranslatedCategory(cat: string): string {
    if (cat.includes(':') || /^\d{4}$/.test(cat)) {
      return cat;
    }
    const key = cat.replace(' ', '_').toUpperCase();
    const translationKey = `DASHBOARD.${key}`;
    const translated = this.translate.instant(translationKey);
    return translated === translationKey ? cat : translated;
  }

  chartOptions = computed(() => {
    this.languageService.currentLanguage();
    this.translateLoaded();
    const filter = this.activeFilter();
    const trend = this.historicalSales[filter];
    const egpLabel = this.translate.instant('DASHBOARD.CURRENCY_EGP');
    return {
      series: [{ name: this.translate.instant('DASHBOARD.SALES_LABEL'), data: trend.data }],
      chart: { type: 'area' as const, height: 220, background: 'transparent', toolbar: { show: false }, sparkline: { enabled: false }, fontFamily: 'var(--font-family-base)' },
      colors: ['#CD9C20'],
      stroke: { curve: 'smooth' as const, width: 2 },
      dataLabels: { enabled: false },
      xaxis: { categories: trend.categories.map((c) => this.getTranslatedCategory(c)), labels: { style: { colors: 'rgba(242, 236, 221, 0.45)', fontSize: '10px' } } },
      yaxis: {
        labels: {
          style: { colors: 'rgba(242, 236, 221, 0.45)', fontSize: '10px' },
          formatter: (val: number) => `${val.toLocaleString()} ${egpLabel}`
        }
      },
      grid: { borderColor: 'rgba(205, 156, 32, 0.05)' },
      theme: { mode: 'dark' as const },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => `${val.toLocaleString()} ${egpLabel}`
        }
      }
    };
  });

  setFilter(filter: 'day' | 'week' | 'month' | '3m' | '6m' | 'year' | '5y') {
    this.activeFilter.set(filter);
  }
}
