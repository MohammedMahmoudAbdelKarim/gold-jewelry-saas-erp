import { DashboardRole } from '@frontend/core';

export type DashboardWidgetId =
  | 'quick-actions'
  | 'kpis'
  | 'gold-price'
  | 'sales-chart'
  | 'revenue-chart'
  | 'category-chart'
  | 'top-selling'
  | 'dead-stock'
  | 'low-stock'
  | 'recent-sales'
  | 'pending-tasks'
  | 'notifications'
  | 'activity';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface KpiMetric {
  id: string;
  labelKey: string;
  icon: string;
  value: string;
  comparisonKey: string;
  trend: TrendDirection;
  trendValue: string;
  route?: string;
}

export interface GoldPriceItem {
  karat: string;
  price: number;
  currency: string;
  trend: TrendDirection;
  changePercent: number;
}

export interface GoldPriceSnapshot {
  items: GoldPriceItem[];
  lastUpdated: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface RevenueChartPoint {
  label: string;
  revenue: number;
  profit: number;
  expenses: number;
}

export interface CategorySlice {
  labelKey: string;
  value: number;
}

export interface TopSellingProduct {
  id: string;
  imageUrl: string;
  name: string;
  weight: string;
  soldCount: number;
  revenue: number;
}

export interface DeadStockItem {
  id: string;
  product: string;
  days: number;
  weight: string;
  value: number;
}

export interface LowStockItem {
  id: string;
  product: string;
  quantity: number;
  minQuantity: number;
  weight: string;
}

export interface RecentSale {
  id: string;
  invoiceNo: string;
  customer: string;
  amount: number;
  time: string;
  status: 'paid' | 'partial' | 'pending';
}

export interface PendingTask {
  id: string;
  labelKey: string;
  count: number;
  icon: string;
  route: string;
}

export interface DashboardNotification {
  id: string;
  type: 'price' | 'stock' | 'login' | 'security' | 'backup' | 'subscription';
  titleKey: string;
  messageKey: string;
  timeKey: string;
  unread: boolean;
}

export interface ActivityItem {
  id: string;
  messageKey: string;
  actor: string;
  timeKey: string;
}

export interface QuickAction {
  id: string;
  labelKey: string;
  icon: string;
  route: string;
}

export interface DashboardSnapshot {
  kpis: KpiMetric[];
  goldPrices: GoldPriceSnapshot;
  salesTrend: ChartPoint[];
  revenueTrend: RevenueChartPoint[];
  categories: CategorySlice[];
  topSelling: TopSellingProduct[];
  deadStock: DeadStockItem[];
  lowStock: LowStockItem[];
  recentSales: RecentSale[];
  pendingTasks: PendingTask[];
  notifications: DashboardNotification[];
  activities: ActivityItem[];
  quickActions: QuickAction[];
}
