import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-top-selling-widget',
  imports: [CurrencyPipe, TranslatePipe, TableModule, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.TOP_SELLING">
      <p-table [value]="store.topSelling()" styleClass="dash-table">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'DASHBOARD.COL_PRODUCT' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_WEIGHT' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_SOLD' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_REVENUE' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td><i class="pi pi-gem me-2"></i>{{ item.name }}</td>
            <td>{{ item.weight }}</td>
            <td>{{ item.soldCount }}</td>
            <td>{{ item.revenue | currency:'EGP':'symbol':'1.0-0' }}</td>
          </tr>
        </ng-template>
      </p-table>
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopSellingWidget {
  protected store = inject(DashboardStore);
}
