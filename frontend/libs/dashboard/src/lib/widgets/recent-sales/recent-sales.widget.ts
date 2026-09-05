import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';

@Component({
  selector: 'app-recent-sales-widget',
  imports: [CommonModule, CurrencyPipe, TranslatePipe, DashboardWidget, SharedTableComponent, CellTemplateDirective],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.RECENT_SALES">
      <app-shared-table
        [data]="store.recentSales()"
        [columns]="tableColumns"
        [isLoading]="store.isLoading()"
        [(currentPage)]="currentPage"
        [(pageSize)]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        noItemsMessage="DASHBOARD.NO_SALES"
      >
        <!-- Invoice No custom cell template -->
        <ng-template appCellTemplate="invoiceNo" let-item>
          <button type="button" class="link-btn invoice-btn" (click)="downloadInvoice(item)" title="Download Invoice">
            {{ item.invoiceNo }}
            <i class="pi pi-download"></i>
          </button>
        </ng-template>

        <!-- Customer custom cell template -->
        <ng-template appCellTemplate="customer" let-item>
          <div class="customer-cell">
            <span class="avatar-initials">{{ getInitials(item.customer) }}</span>
            <button type="button" class="link-btn" (click)="viewCustomerDetails(item.customer)" title="View Customer Details">
              {{ item.customer }}
            </button>
          </div>
        </ng-template>

        <!-- Amount custom cell template -->
        <ng-template appCellTemplate="amount" let-item>
          <span>EGP {{ item.amount | number:'1.0-0' }}</span>
        </ng-template>

        <!-- Time custom cell template -->
        <ng-template appCellTemplate="time" let-item>
          <span>
            {{ 'DASHBOARD.TIME_TODAY' | translate }},
            {{ formatTimeWithAmPm(item.time) }}
          </span>
        </ng-template>

        <!-- Status custom cell template -->
        <ng-template appCellTemplate="status" let-item>
          <span class="status-pill" [class.status-instock]="item.status === 'paid'" [class.status-reserved]="item.status === 'partial'" [class.status-sold]="item.status === 'pending'">
            {{ 'DASHBOARD.STATUS_' + item.status.toUpperCase() | translate }}
          </span>
        </ng-template>
      </app-shared-table>
    </app-dashboard-widget>

    <!-- Customer Details Modal -->
    @if (selectedCustomer(); as customer) {
      <div class="modal-backdrop" (click)="closeCustomerDetails()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ 'DASHBOARD.CUST_DETAILS' | translate }}</h3>
            <button class="close-btn" (click)="closeCustomerDetails()">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <div class="customer-avatar">
              <i class="pi pi-user"></i>
            </div>
            <div class="info-group">
              <span class="info-label">{{
                'DASHBOARD.CUST_NAME' | translate
              }}</span>
              <span class="info-value">{{ customer.name }}</span>
            </div>
            <div class="info-group">
              <span class="info-label">{{
                'DASHBOARD.CUST_PHONE' | translate
              }}</span>
              <span class="info-value">{{ customer.phone }}</span>
            </div>
            <div class="info-group">
              <span class="info-label">{{
                'DASHBOARD.CUST_TIER' | translate
              }}</span>
              <span class="info-value gold-tier"
                ><i class="pi pi-star-fill"></i>
                {{ 'DASHBOARD.CUST_GOLD' | translate }}</span
              >
            </div>
            <div class="info-group">
              <span class="info-label">{{
                'DASHBOARD.CUST_TOTAL' | translate
              }}</span>
              <span class="info-value">{{
                customer.totalSales | currency: 'EGP' : 'symbol' : '1.0-0'
              }}</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.55rem;
      border-radius: var(--border-radius-sm);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      min-width: 75px;
      text-align: center;

      &.paid {
        color: var(--color-success);
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      &.partial {
        color: var(--color-warning);
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.2);
      }

      &.pending {
        color: var(--color-danger);
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.2);
      }
    }

    .link-btn {
      background: transparent;
      border: none;
      color: #f2ecdd !important;
      cursor: pointer;
      font-weight: 500;
      padding: 0;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s ease;
      font-family: inherit;
      font-size: 0.85rem;
      text-decoration: none;

      &:hover {
        color: var(--color-primary) !important;
        text-decoration: underline !important;
      }
    }

    .invoice-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.45rem !important;
      line-height: 1 !important;

      i {
        font-size: 0.75rem !important;
        color: rgba(242, 236, 221, 0.4) !important;
        transition: color 0.15s ease !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        transform: translateY(-1px) !important;
      }

      &:hover i {
        color: var(--color-primary) !important;
      }
    }

    .customer-cell {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }

    .avatar-initials {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(205, 156, 32, 0.08);
      border: 1px solid rgba(205, 156, 32, 0.25);
      color: #CD9C20;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-card {
      background: #0d0d0d;
      border: 1px solid rgba(205, 156, 32, 0.2);
      border-radius: var(--border-radius-lg);
      width: 90%;
      max-width: 400px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      animation: modal-fade-in 0.2s ease-out;
    }

    @keyframes modal-fade-in {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .modal-header {
      background: rgba(205, 156, 32, 0.05);
      border-bottom: 1px solid rgba(205, 156, 32, 0.1);
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: #cd9c20;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: rgba(242, 236, 221, 0.5);
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
        padding: 0;

        &:hover {
          color: #f2ecdd;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .customer-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(205, 156, 32, 0.08);
      border: 1px solid rgba(205, 156, 32, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;

      i {
        font-size: 1.75rem;
        color: #cd9c20;
      }
    }

    .info-group {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 0.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);

      .info-label {
        font-size: 0.7rem;
        color: rgba(242, 236, 221, 0.45);
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .info-value {
        font-size: 0.9rem;
        color: #f2ecdd;
        font-weight: 600;

        &.gold-tier {
          color: #cd9c20;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
      }
    }

    ::ng-deep .p-paginator {
      background: transparent !important;
      border: none !important;
      border-top: 1px solid rgba(205, 156, 32, 0.08) !important;
      padding: 0.75rem 0 0 !important;
      justify-content: flex-end !important;
      gap: 0.15rem !important;

      .p-paginator-pages .p-paginator-page,
      .p-paginator-first,
      .p-paginator-prev,
      .p-paginator-next,
      .p-paginator-last {
        background: rgba(255, 255, 255, 0.02) !important;
        border: 1px solid rgba(205, 156, 32, 0.1) !important;
        color: rgba(242, 236, 221, 0.5) !important;
        min-width: 2rem !important;
        height: 2rem !important;
        margin: 0 !important;
        border-radius: 4px !important;
        transition: all 0.15s ease !important;
        font-size: 0.7rem !important;
        font-weight: 700 !important;

        &:hover:not(.p-disabled) {
          border-color: rgba(205, 156, 32, 0.3) !important;
          background: rgba(205, 156, 32, 0.12) !important;
          color: #f2ecdd !important;
        }

        &.p-highlight {
          background: #cd9c20 !important;
          border-color: #cd9c20 !important;
          color: #0b0b0b !important;
        }

        &.p-disabled {
          opacity: 0.25 !important;
          cursor: not-allowed !important;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentSalesWidget {
  protected store = inject(DashboardStore);
  private languageService = inject(LanguageService);
  selectedCustomer = signal<any>(null);

  tableColumns: TableColumn[] = [
    { key: 'invoiceNo', header: 'DASHBOARD.COL_INVOICE' },
    { key: 'customer', header: 'DASHBOARD.COL_CUSTOMER' },
    { key: 'amount', header: 'DASHBOARD.COL_AMOUNT', align: 'right' },
    { key: 'time', header: 'DASHBOARD.COL_TIME' },
    { key: 'status', header: 'DASHBOARD.COL_STATUS', type: 'status' },
  ];

  currentPage = signal<number>(1);
  pageSize = signal<number>(4);
  pageSizeOptions = [4, 8, 12, 20];

  customerDetailsMap: Record<
    string,
    { name: string; phone: string; totalSales: number }
  > = {
    'Ahmed Hassan': {
      name: 'Ahmed Hassan',
      phone: '+20 102 345 6789',
      totalSales: 85400,
    },
    'Sara Ali': {
      name: 'Sara Ali',
      phone: '+20 114 987 6543',
      totalSales: 120600,
    },
    'Mohamed Farid': {
      name: 'Mohamed Farid',
      phone: '+20 122 555 1234',
      totalSales: 45200,
    },
    'Layla Nour': {
      name: 'Layla Nour',
      phone: '+20 155 777 8899',
      totalSales: 198000,
    },
  };

  downloadInvoice(item: any) {
    const content = `INVOICE: ${item.invoiceNo}\nCustomer: ${item.customer}\nAmount: ${item.amount} EGP\nTime: ${item.time}\nStatus: ${item.status}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${item.invoiceNo.replace('#', '')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  viewCustomerDetails(name: string) {
    const details = this.customerDetailsMap[name] || {
      name,
      phone: '+20 100 000 0000',
      totalSales: 15000,
    };
    this.selectedCustomer.set(details);
  }

  closeCustomerDetails() {
    this.selectedCustomer.set(null);
  }

  formatTimeWithAmPm(timeStr: string): string {
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const dispHours = hours % 12 || 12;
    const dispMinutes = minutes < 10 ? `0${minutes}` : minutes;

    const lang = this.languageService.currentLanguage();
    if (lang === 'ar') {
      const arabicAmPm = ampm === 'AM' ? 'ص' : 'م';
      return `${dispHours}:${dispMinutes} ${arabicAmPm}`;
    }
    return `${dispHours}:${dispMinutes} ${ampm}`;
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
