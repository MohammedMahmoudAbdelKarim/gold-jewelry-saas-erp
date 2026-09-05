import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-low-stock-widget',
  imports: [TranslatePipe, TableModule, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.LOW_STOCK">
      <p-table [value]="store.lowStock()" styleClass="dash-table">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'DASHBOARD.COL_PRODUCT' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_QTY' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_MIN' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_WEIGHT' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td>{{ item.product }}</td>
            <td class="text-danger">{{ item.quantity }}</td>
            <td>{{ item.minQuantity }}</td>
            <td>{{ item.weight }}</td>
          </tr>
        </ng-template>
      </p-table>
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LowStockWidget {
  protected store = inject(DashboardStore);
}
