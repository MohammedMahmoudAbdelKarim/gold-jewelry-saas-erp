import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { DashboardSnapshot } from '../models/dashboard.models';

const MOCK_SNAPSHOT: DashboardSnapshot = {
  quickActions: [
    { id: 'sale', labelKey: 'DASHBOARD.ACTION_NEW_SALE', icon: 'pi-plus', route: '/sales' },
    { id: 'purchase', labelKey: 'DASHBOARD.ACTION_PURCHASE', icon: 'pi-shopping-bag', route: '/purchase' },
    { id: 'product', labelKey: 'DASHBOARD.ACTION_ADD_PRODUCT', icon: 'pi-box', route: '/inventory/items/new' },
    { id: 'customer', labelKey: 'DASHBOARD.ACTION_ADD_CUSTOMER', icon: 'pi-user-plus', route: '/customers' },
    { id: 'stock', labelKey: 'DASHBOARD.ACTION_STOCK_COUNT', icon: 'pi-list-check', route: '/inventory' },
    { id: 'barcode', labelKey: 'DASHBOARD.ACTION_PRINT_BARCODE', icon: 'pi-qrcode', route: '/inventory/items' },
  ],
  kpis: [
    {
      id: 'today-sales',
      labelKey: 'DASHBOARD.KPI_TODAY_SALES',
      icon: 'pi-shopping-cart',
      value: '485,000 EGP',
      comparisonKey: 'DASHBOARD.VS_YESTERDAY',
      trend: 'up',
      trendValue: '+15.2%',
      route: '/sales'
    },
    {
      id: 'gold-value',
      labelKey: 'DASHBOARD.KPI_STOCK_VALUE',
      icon: 'pi-box',
      value: '34,500,000 EGP',
      comparisonKey: 'DASHBOARD.KPI_STOCK_WEIGHT_VAL',
      trend: 'up',
      trendValue: '+2.4%',
      route: '/inventory'
    },
    {
      id: 'customers-today',
      labelKey: 'DASHBOARD.KPI_CUSTOMERS_TODAY',
      icon: 'pi-users',
      value: '18',
      comparisonKey: 'DASHBOARD.VS_YESTERDAY',
      trend: 'up',
      trendValue: '+3',
      route: '/customers'
    },
    {
      id: 'available-cash',
      labelKey: 'DASHBOARD.KPI_SAFE',
      icon: 'pi-wallet',
      value: '215,000 EGP',
      comparisonKey: 'DASHBOARD.VS_YESTERDAY',
      trend: 'down',
      trendValue: '-4.1%',
      route: '/accounting'
    }
  ],
  goldPrices: {
    lastUpdated: new Date().toISOString(),
    items: [
      { karat: '24K', price: 3850, currency: 'EGP', trend: 'up', changePercent: 0.8 },
      { karat: '21K', price: 3368, currency: 'EGP', trend: 'up', changePercent: 0.7 },
      { karat: '18K', price: 2888, currency: 'EGP', trend: 'down', changePercent: -0.3 },
      { karat: 'Silver', price: 42, currency: 'EGP', trend: 'flat', changePercent: 0 },
    ],
  },
  salesTrend: Array.from({ length: 30 }, (_, i) => ({
    label: `D${i + 1}`,
    value: 120000 + Math.round(Math.sin(i / 3) * 30000) + i * 1800,
  })),
  revenueTrend: [
    { label: 'Jan', revenue: 820000, profit: 210000, expenses: 140000 },
    { label: 'Feb', revenue: 910000, profit: 240000, expenses: 150000 },
    { label: 'Mar', revenue: 880000, profit: 225000, expenses: 148000 },
    { label: 'Apr', revenue: 960000, profit: 260000, expenses: 155000 },
    { label: 'May', revenue: 1020000, profit: 285000, expenses: 162000 },
    { label: 'Jun', revenue: 990000, profit: 270000, expenses: 158000 },
  ],
  categories: [
    { labelKey: 'DASHBOARD.CAT_RINGS', value: 32 },
    { labelKey: 'DASHBOARD.CAT_CHAINS', value: 24 },
    { labelKey: 'DASHBOARD.CAT_BRACELETS', value: 18 },
    { labelKey: 'DASHBOARD.CAT_COINS', value: 14 },
    { labelKey: 'DASHBOARD.CAT_BARS', value: 12 },
  ],
  topSelling: [
    { id: '1', imageUrl: '', name: '24K Wedding Ring', weight: '8.4g', soldCount: 42, revenue: 168000 },
    { id: '2', imageUrl: '', name: '21K Chain Necklace', weight: '22.1g', soldCount: 31, revenue: 245000 },
    { id: '3', imageUrl: '', name: '18K Bracelet', weight: '15.6g', soldCount: 27, revenue: 132000 },
    { id: '4', imageUrl: '', name: 'Gold Coin 8g', weight: '8.0g', soldCount: 24, revenue: 96000 },
  ],
  deadStock: [
    { id: '1', product: 'Vintage Brooch 21K', days: 412, weight: '6.2g', value: 18500 },
    { id: '2', product: 'Classic Ring 18K', days: 198, weight: '4.8g', value: 12200 },
    { id: '3', product: 'Coin Set 24K', days: 96, weight: '16.0g', value: 52000 },
  ],
  lowStock: [
    { id: '1', product: '24K Plain Band', quantity: 2, minQuantity: 8, weight: '3.2g' },
    { id: '2', product: '21K Kids Chain', quantity: 4, minQuantity: 10, weight: '5.5g' },
    { id: '3', product: 'Silver Anklet', quantity: 1, minQuantity: 6, weight: '12.0g' },
  ],
  recentSales: Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 1}`,
    invoiceNo: `#10${40 + i}`,
    customer: ['Ahmed Hassan', 'Sara Ali', 'Mohamed Farid', 'Layla Nour'][i % 4],
    amount: 12500 + i * 2300,
    time: `${10 + i}:15`,
    status: (['paid', 'partial', 'pending'] as const)[i % 3],
  })),
  pendingTasks: [
    { id: '1', labelKey: 'DASHBOARD.TASK_REPAIRS', count: 5, icon: 'pi-wrench', route: '/inventory' },
    { id: '2', labelKey: 'DASHBOARD.TASK_TRANSFERS', count: 3, icon: 'pi-arrow-right-arrow-left', route: '/inventory' },
    { id: '3', labelKey: 'DASHBOARD.TASK_PURCHASES', count: 2, icon: 'pi-shopping-bag', route: '/purchase' },
    { id: '4', labelKey: 'DASHBOARD.TASK_RETURNS', count: 1, icon: 'pi-replay', route: '/sales' },
  ],
  notifications: [
    { id: '1', type: 'price', titleKey: 'DASHBOARD.NOTIF_PRICE_TITLE', messageKey: 'DASHBOARD.NOTIF_PRICE_MSG', timeKey: 'DASHBOARD.TIME_5M', unread: true },
    { id: '2', type: 'stock', titleKey: 'DASHBOARD.NOTIF_STOCK_TITLE', messageKey: 'DASHBOARD.NOTIF_STOCK_MSG', timeKey: 'DASHBOARD.TIME_1H', unread: true },
    { id: '3', type: 'login', titleKey: 'DASHBOARD.NOTIF_LOGIN_TITLE', messageKey: 'DASHBOARD.NOTIF_LOGIN_MSG', timeKey: 'DASHBOARD.TIME_3H', unread: false },
    { id: '4', type: 'backup', titleKey: 'DASHBOARD.NOTIF_BACKUP_TITLE', messageKey: 'DASHBOARD.NOTIF_BACKUP_MSG', timeKey: 'DASHBOARD.TIME_TODAY', unread: false },
  ],
  activities: [
    { id: '1', messageKey: 'DASHBOARD.ACT_SALE', actor: 'Ahmed', timeKey: 'DASHBOARD.TIME_5M' },
    { id: '2', messageKey: 'DASHBOARD.ACT_PRODUCT', actor: 'Mohamed', timeKey: 'DASHBOARD.TIME_20M' },
    { id: '3', messageKey: 'DASHBOARD.ACT_TRANSFER', actor: 'Ali', timeKey: 'DASHBOARD.TIME_1H' },
    { id: '4', messageKey: 'DASHBOARD.ACT_PRICE', actor: 'Manager', timeKey: 'DASHBOARD.TIME_3H' },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  getDashboard(): Observable<DashboardSnapshot> {
    return of(this.cloneSnapshot()).pipe(delay(300));
  }

  getKpis() {
    return of(MOCK_SNAPSHOT.kpis).pipe(delay(200));
  }

  getCharts() {
    return of({
      salesTrend: MOCK_SNAPSHOT.salesTrend,
      revenueTrend: MOCK_SNAPSHOT.revenueTrend,
      categories: MOCK_SNAPSHOT.categories,
    }).pipe(delay(250));
  }

  getRecentSales() {
    return of(MOCK_SNAPSHOT.recentSales).pipe(delay(200));
  }

  getNotifications() {
    return of(MOCK_SNAPSHOT.notifications).pipe(delay(150));
  }

  private cloneSnapshot(): DashboardSnapshot {
    return JSON.parse(JSON.stringify(MOCK_SNAPSHOT)) as DashboardSnapshot;
  }
}
