import { DashboardRole } from '@frontend/core';
import { DashboardWidgetId } from '../models/dashboard.models';

export const ROLE_WIDGET_LAYOUT: Record<DashboardRole, DashboardWidgetId[]> = {
  owner: [
    'quick-actions',
    'kpis',
    'gold-price',
    'sales-chart',
    'revenue-chart',
    'category-chart',
    'top-selling',
    'recent-sales',
  ],
  sales: [
    'quick-actions',
    'kpis',
    'gold-price',
    'sales-chart',
    'recent-sales',
    'top-selling',
  ],
  inventory: [
    'quick-actions',
    'kpis',
    'gold-price',
    'sales-chart',
  ],
  accountant: [
    'kpis',
    'gold-price',
    'sales-chart',
    'revenue-chart',
    'recent-sales',
  ],
};

export const ROLE_KPI_IDS: Record<DashboardRole, string[]> = {
  owner: ['today-sales', 'gold-value', 'customers-today', 'available-cash'],
  sales: ['today-sales', 'gold-value', 'customers-today', 'available-cash'],
  inventory: ['today-sales', 'gold-value', 'customers-today', 'available-cash'],
  accountant: ['today-sales', 'gold-value', 'customers-today', 'available-cash'],
};
