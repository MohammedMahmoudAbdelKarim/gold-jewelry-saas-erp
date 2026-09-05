import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';
import { SystemSettingsService, LanguageService } from '@frontend/core';

@Component({
  selector: 'app-gold-price-widget',
  imports: [DecimalPipe, TranslatePipe, DashboardWidget, NgApexchartsModule],
  template: `
  <app-dashboard-widget titleKey="DASHBOARD.GOLD_PRICES">
    @if (snapshot(); as gold) {
      <div class="live-header">
        <div class="exchange-rate-badge">
          <i class="pi pi-dollar"></i>
          <span>{{ 'DASHBOARD.EXCHANGE_RATE_LABEL' | translate }}: <strong>{{ systemSettingsService.config().dollarPrice | number:'1.2-2' }} {{ 'DASHBOARD.CURRENCY_EGP' | translate }}</strong></span>
        </div>
        <span class="live-badge">
          <span class="pulse"></span>
          {{ 'DASHBOARD.LIVE' | translate }}
        </span>
      </div>

      <div class="gold-screen-display">
        <div class="gold-grid">
          @for (item of goldItems(); track item.karat) {
            <div class="gold-item-card" [class]="item.trend">
              <div class="card-header">
                <span class="karat-badge">
                  @if (item.karat === '24K') {
                    <svg class="gold-icon-svg" viewBox="0 0 24 24" width="14" height="14"><path fill="#d4af37" d="M2,21H22V19H2V21M20,15.5L22,17H2L4,15.5L20,15.5M4,14L2,9H22L20,14H4M4,8L6,3H18L20,8H4Z"/></svg>
                  } @else if (item.karat === '21K') {
                    <svg class="gold-icon-svg" viewBox="0 0 24 24" width="14" height="14"><path fill="#e5c158" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>
                  } @else if (item.karat === '18K') {
                    <svg class="gold-icon-svg" viewBox="0 0 24 24" width="14" height="14"><path fill="#f3db8b" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  } @else {
                    <svg class="silver-icon-svg" viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="10" fill="#c0c0c0"/><circle cx="12" cy="12" r="7" fill="none" stroke="#fff" stroke-width="1"/></svg>
                  }
                  {{ item.karat }}
                </span>
                <span class="trend-indicator">
                  @if (item.trend === 'up') { <i class="pi pi-arrow-up-right"></i> }
                  @else if (item.trend === 'down') { <i class="pi pi-arrow-down-right"></i> }
                  @else { <i class="pi pi-minus"></i> }
                </span>
              </div>
              <div class="price-display">
                <span class="price-val">{{ item.price | number:'1.0-0' }}</span>
                <span class="currency">{{ item.currency }}</span>
              </div>
              <div class="usd-price">
                <span>\${{ getUsdPrice(item.price) | number:'1.2-2' }}</span>
                <span class="usd-unit">/g</span>
              </div>
              <div class="trend-percent" [class]="item.trend">
                {{ item.trend === 'up' ? '+' : '' }}{{ item.changePercent }}%
              </div>
            </div>
          }
        </div>

        <!-- Chart Filter Controls -->
        <div class="chart-controls">
          <span class="control-title">{{ 'DASHBOARD.PRICE_TREND' | translate }}</span>
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

        <!-- Apex Chart for price difference -->
        <div class="trend-chart-wrap">
          <apx-chart
            [series]="chartOptions().series"
            [chart]="chartOptions().chart"
            [xaxis]="chartOptions().xaxis"
            [yaxis]="chartOptions().yaxis"
            [colors]="chartOptions().colors"
            [stroke]="chartOptions().stroke"
            [dataLabels]="chartOptions().dataLabels"
            [grid]="chartOptions().grid"
            [legend]="chartOptions().legend"
            [tooltip]="chartOptions().tooltip"
          />
        </div>
      </div>
      <p class="updated">
        <i class="pi pi-clock"></i>
        <span>{{ 'DASHBOARD.LAST_UPDATE' | translate }}: {{ formattedLastUpdate() }}</span>
      </p>
    }
  </app-dashboard-widget>
  `,
  styles: `
    .live-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .exchange-rate-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      background: var(--color-surface-hover);
      padding: 0.25rem 0.65rem;
      border-radius: 50px;
      border: 1px solid var(--border-color);
      font-weight: 600;
    }
    .exchange-rate-badge strong {
      color: var(--color-success);
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-glow);
      padding: 0.25rem 0.65rem;
      border-radius: 50px;
      border: 1px solid rgba(162, 124, 56, 0.15);
    }
    .pulse {
      width: 6px;
      height: 6px;
      background-color: var(--color-primary);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(162, 124, 56, 0.4);
      animation: pulse-ring 2s infinite cubic-bezier(0.66, 0, 0, 1);
    }
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(162, 124, 56, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(162, 124, 56, 0); }
      100% { box-shadow: 0 0 0 0 rgba(162, 124, 56, 0); }
    }
    
    .gold-screen-display {
      background: var(--color-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 0.75rem;
      box-shadow: var(--box-shadow-sm);
      position: relative;
      overflow: hidden;
    }
    
    .gold-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      position: relative;
      z-index: 2;
    }
    
    .gold-item-card {
      background: var(--color-surface-hover);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 0.65rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: var(--transition-smooth);
    }

    .gold-item-card:hover {
      border-color: var(--border-color-hover);
      transform: translateY(-1px);
    }
    
    .card-header {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    
    .karat-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
    }
    
    .trend-indicator {
      font-size: 0.75rem;
    }
    .gold-item-card.up .trend-indicator { color: var(--color-success); }
    .gold-item-card.down .trend-indicator { color: var(--color-danger); }
    .gold-item-card.flat .trend-indicator { color: var(--color-text-muted); }
    
    .price-display {
      display: flex;
      align-items: baseline;
      gap: 0.15rem;
      margin: 0.25rem 0 0.1rem;
    }
    
    .price-val {
      font-size: 1.2rem;
      font-weight: 700;
      font-family: inherit;
      color: var(--color-text);
      letter-spacing: -0.02em;
    }
    .gold-item-card.up .price-val {
      color: var(--color-success);
    }
    .gold-item-card.down .price-val {
      color: var(--color-danger);
    }
    
    .currency {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }
    
    .usd-price {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      font-weight: 500;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.05rem;
    }
    .usd-unit {
      font-size: 0.6rem;
      color: var(--color-text-muted);
      opacity: 0.8;
    }
    
    .trend-percent {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .trend-percent.up { color: var(--color-success); background: rgba(16, 185, 129, 0.08); }
    .trend-percent.down { color: var(--color-danger); background: rgba(239, 68, 68, 0.08); }
    .trend-percent.flat { color: var(--color-text-muted); background: var(--color-surface); }

    .chart-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(205, 156, 32, 0.1);
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
      margin-top: 0.5rem;
      min-height: 180px;
    }
    
    .updated {
      margin: 0.5rem 0 0;
      font-size: 0.65rem;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 0.3rem;
      justify-content: flex-end;
    }
    
    @media (max-width: 768px) {
      .gold-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoldPriceWidget {
  protected store = inject(DashboardStore);
  protected systemSettingsService = inject(SystemSettingsService);
  protected snapshot = computed(() => this.store.goldPrices());

  goldItems = computed(() => {
    const cfg = this.systemSettingsService.config();
    return [
      { karat: '24K', price: cfg.karat24, currency: 'EGP', trend: 'up', changePercent: 0.8 },
      { karat: '21K', price: cfg.karat21, currency: 'EGP', trend: 'up', changePercent: 0.7 },
      { karat: '18K', price: cfg.karat18, currency: 'EGP', trend: 'down', changePercent: -0.3 },
      { karat: 'Silver', price: cfg.silver, currency: 'EGP', trend: 'flat', changePercent: 0 },
    ];
  });

  activeFilter = signal<'day' | 'week' | 'month' | '3m' | '6m' | 'year' | '5y'>('month');

  readonly historicalData: Record<string, { categories: string[], series: { name: string, data: number[] }[] }> = {
    day: {
      categories: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      series: [
        { name: '24K', data: [3840, 3842, 3845, 3841, 3848, 3850, 3847, 3852, 3849, 3850] },
        { name: '21K', data: [3358, 3360, 3362, 3359, 3365, 3368, 3365, 3370, 3367, 3368] },
        { name: '18K', data: [2892, 2891, 2890, 2893, 2889, 2888, 2890, 2886, 2887, 2888] }
      ]
    },
    week: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        { name: '24K', data: [3820, 3835, 3840, 3838, 3845, 3842, 3850] },
        { name: '21K', data: [3340, 3355, 3360, 3358, 3365, 3362, 3368] },
        { name: '18K', data: [2905, 2900, 2895, 2892, 2890, 2892, 2888] }
      ]
    },
    month: {
      categories: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      series: [
        { name: '24K', data: [3780, 3810, 3830, 3850] },
        { name: '21K', data: [3305, 3332, 3350, 3368] },
        { name: '18K', data: [2930, 2915, 2900, 2888] }
      ]
    },
    '3m': {
      categories: ['May', 'Jun', 'Jul'],
      series: [
        { name: '24K', data: [3720, 3790, 3850] },
        { name: '21K', data: [3250, 3315, 3368] },
        { name: '18K', data: [2970, 2920, 2888] }
      ]
    },
    '6m': {
      categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      series: [
        { name: '24K', data: [3650, 3690, 3740, 3720, 3790, 3850] },
        { name: '21K', data: [3190, 3225, 3270, 3250, 3315, 3368] },
        { name: '18K', data: [3010, 2990, 2960, 2970, 2920, 2888] }
      ]
    },
    year: {
      categories: ['Aug 25', 'Oct 25', 'Dec 25', 'Feb 26', 'Apr 26', 'Jun 26'],
      series: [
        { name: '24K', data: [3400, 3510, 3590, 3650, 3740, 3850] },
        { name: '21K', data: [2975, 3070, 3140, 3190, 3270, 3368] },
        { name: '18K', data: [3180, 3120, 3070, 3010, 2960, 2888] }
      ]
    },
    '5y': {
      categories: ['2022', '2023', '2024', '2025', '2026'],
      series: [
        { name: '24K', data: [1850, 2450, 3100, 3550, 3850] },
        { name: '21K', data: [1618, 2140, 2710, 3105, 3368] },
        { name: '18K', data: [1387, 1837, 2325, 2660, 2888] }
      ]
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
    const data = this.historicalData[filter];
    return {
      series: data.series,
      chart: {
        type: 'line' as const,
        height: 180,
        background: 'transparent',
        toolbar: { show: false },
        sparkline: { enabled: false },
        fontFamily: 'var(--font-family-base)'
      },
      colors: ['#F5CB5C', '#CD9C20', '#C084FC'],
      stroke: { curve: 'smooth' as const, width: 2 },
      dataLabels: { enabled: false },
      xaxis: {
        categories: data.categories.map((c) => this.getTranslatedCategory(c)),
        labels: { style: { colors: 'rgba(242, 236, 221, 0.45)', fontSize: '10px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: { colors: 'rgba(242, 236, 221, 0.45)', fontSize: '10px' },
          formatter: (val: number) => `${val.toLocaleString()} ${this.translate.instant('DASHBOARD.CURRENCY_EGP')}`
        }
      },
      grid: { borderColor: 'rgba(205, 156, 32, 0.05)' },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => {
            const usd = val / this.systemSettingsService.config().dollarPrice;
            const egpLabel = this.translate.instant('DASHBOARD.CURRENCY_EGP');
            const usdLabel = this.translate.instant('DASHBOARD.CURRENCY_USD');
            return `${val.toLocaleString()} ${egpLabel} ($${usd.toFixed(2)} ${usdLabel})`;
          }
        }
      },
      legend: {
        show: true,
        position: 'top' as const,
        horizontalAlign: 'right' as const,
        labels: { colors: 'rgba(242, 236, 221, 0.7)' }
      }
    };
  });

  getUsdPrice(egpPrice: number): number {
    return egpPrice / this.systemSettingsService.config().dollarPrice;
  }

  setFilter(filter: 'day' | 'week' | 'month' | '3m' | '6m' | 'year' | '5y') {
    this.activeFilter.set(filter);
  }

  formattedLastUpdate = computed(() => {
    this.translateLoaded();
    const lang = this.languageService.currentLanguage();
    const gold = this.snapshot();
    if (!gold?.lastUpdated) return '';
    try {
      const date = new Date(gold.lastUpdated);
      return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      }).format(date);
    } catch {
      return gold.lastUpdated;
    }
  });
}
