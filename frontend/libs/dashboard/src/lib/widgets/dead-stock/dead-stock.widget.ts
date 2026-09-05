import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-dead-stock-widget',
  imports: [CurrencyPipe, TranslatePipe, TableModule, TagModule, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.DEAD_STOCK">
      <p-table [value]="store.deadStock()" styleClass="dash-table">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'DASHBOARD.COL_PRODUCT' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_DAYS' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_WEIGHT' | translate }}</th>
            <th>{{ 'DASHBOARD.COL_VALUE' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td>{{ item.product }}</td>
            <td>
              <p-tag
                [value]="item.days + ' ' + ('DASHBOARD.DAYS' | translate)"
                [severity]="item.days >= 365 ? 'danger' : item.days >= 180 ? 'warn' : 'secondary'"
              />
            </td>
            <td>{{ item.weight }}</td>
            <td>{{ item.value | currency:'EGP':'symbol':'1.0-0' }}</td>
          </tr>
        </ng-template>
      </p-table>
    </app-dashboard-widget>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeadStockWidget {
  protected store = inject(DashboardStore);
}
