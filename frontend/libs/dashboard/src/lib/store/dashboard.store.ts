import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { RoleService } from '@frontend/core';
import { DashboardApiService } from '../api/dashboard-api.service';
import { DashboardSnapshot } from '../models/dashboard.models';
import { ROLE_KPI_IDS, ROLE_WIDGET_LAYOUT } from '../config/widget-layout.config';

interface DashboardState {
  data: DashboardSnapshot | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const emptyState: DashboardState = {
  data: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(emptyState),
  withComputed((state, roleService = inject(RoleService)) => ({
    widgets: computed(() => {
      const role = roleService.currentRole();
      return ROLE_WIDGET_LAYOUT[role];
    }),
    kpis: computed(() => {
      const data = state.data();
      if (!data) return [];
      const role = roleService.currentRole();
      const allowed = new Set(ROLE_KPI_IDS[role]);
      return data.kpis.filter((kpi) => allowed.has(kpi.id));
    }),
    quickActions: computed(() => state.data()?.quickActions ?? []),
    goldPrices: computed(() => state.data()?.goldPrices ?? null),
    salesTrend: computed(() => state.data()?.salesTrend ?? []),
    revenueTrend: computed(() => state.data()?.revenueTrend ?? []),
    categories: computed(() => state.data()?.categories ?? []),
    topSelling: computed(() => state.data()?.topSelling ?? []),
    deadStock: computed(() => state.data()?.deadStock ?? []),
    lowStock: computed(() => state.data()?.lowStock ?? []),
    recentSales: computed(() => state.data()?.recentSales ?? []),
    pendingTasks: computed(() => state.data()?.pendingTasks ?? []),
    notifications: computed(() => state.data()?.notifications ?? []),
    activities: computed(() => state.data()?.activities ?? []),
  })),
  withMethods((state, api = inject(DashboardApiService)) => ({
    load: rxMethod<boolean | void>(
      pipe(
        tap((refresh) =>
          patchState(state, refresh ? { isRefreshing: true, error: null } : { isLoading: true, error: null })
        ),
        switchMap(() =>
          api.getDashboard().pipe(
            tapResponse({
              next: (data: DashboardSnapshot) =>
                patchState(state, {
                  data,
                  isLoading: false,
                  isRefreshing: false,
                  lastUpdated: new Date().toISOString(),
                }),
              error: (err: Error) =>
                patchState(state, {
                  error: err.message,
                  isLoading: false,
                  isRefreshing: false,
                }),
            })
          )
        )
      )
    ),
    refresh() {
      this.load(true);
    },
  }))
);

export type DashboardStoreType = InstanceType<typeof DashboardStore>;
