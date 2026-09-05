import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { DashboardStore } from '../store/dashboard.store';
import { DashboardHeader } from '../components/dashboard-header/dashboard-header';
import { QuickActionsWidget } from '../widgets/quick-actions/quick-actions.widget';
import { KpiGridWidget } from '../widgets/kpi-grid/kpi-grid.widget';
import { GoldPriceWidget } from '../widgets/gold-price/gold-price.widget';
import { SalesChartWidget } from '../widgets/sales-chart/sales-chart.widget';
import { RevenueChartWidget } from '../widgets/revenue-chart/revenue-chart.widget';
import { CategoryChartWidget } from '../widgets/category-chart/category-chart.widget';
import { TopSellingWidget } from '../widgets/top-selling/top-selling.widget';
import { DeadStockWidget } from '../widgets/dead-stock/dead-stock.widget';
import { LowStockWidget } from '../widgets/low-stock/low-stock.widget';
import { RecentSalesWidget } from '../widgets/recent-sales/recent-sales.widget';
import { PendingTasksWidget } from '../widgets/pending-tasks/pending-tasks.widget';
import { DashboardNotificationsWidget } from '../widgets/notifications/dashboard-notifications.widget';
import { ActivityTimelineWidget } from '../widgets/activity-timeline/activity-timeline.widget';
import { DashboardWidgetId } from '../models/dashboard.models';
import { PageLoaderComponent } from '@frontend/ui';

const WIDGET_SPAN: Record<DashboardWidgetId, string> = {
  'quick-actions': 'span-12',
  kpis: 'span-12',
  'gold-price': 'span-12',
  'sales-chart': 'span-12',
  'revenue-chart': 'span-12',
  'category-chart': 'span-12',
  'top-selling': 'span-12',
  'dead-stock': 'span-12',
  'low-stock': 'span-12',
  'recent-sales': 'span-12',
  'pending-tasks': 'span-12',
  notifications: 'span-12',
  activity: 'span-12',
};

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    DashboardHeader,
    QuickActionsWidget,
    KpiGridWidget,
    GoldPriceWidget,
    SalesChartWidget,
    RevenueChartWidget,
    CategoryChartWidget,
    TopSellingWidget,
    DeadStockWidget,
    LowStockWidget,
    RecentSalesWidget,
    PendingTasksWidget,
    DashboardNotificationsWidget,
    ActivityTimelineWidget,
    PageLoaderComponent,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private title = inject(Title);
  private meta = inject(Meta);
  protected store = inject(DashboardStore);
  protected widgetSpan = WIDGET_SPAN;

  ngOnInit() {
    this.title.setTitle('Gold Jewelry ERP - Dashboard');
    this.meta.updateTag({ name: 'description', content: 'Enterprise gold jewelry ERP dashboard' });
    this.store.load();
  }
}
