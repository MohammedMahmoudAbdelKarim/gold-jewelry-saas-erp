import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';
import { PurchaseApiService } from '../api/purchase-api.service';
import { PurchaseOrder } from '../models/purchase.models';

@Component({
  selector: 'lib-purchase',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    RouterModule,
    SharedTableComponent,
    CellTemplateDirective,
  ],
  templateUrl: './purchase.html',
  styleUrl: './purchase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Purchase implements OnInit {
  private purchaseApi = inject(PurchaseApiService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  orders = signal<PurchaseOrder[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Custom Delete Confirm modal
  showDeleteConfirmModal = signal<boolean>(false);
  orderToDeleteId = signal<string | null>(null);

  // Actions Dropdown state
  activeDropdownOrderId = signal<string | null>(null);

  tableColumns: TableColumn[] = [
    { key: 'po_number', header: 'PURCHASE.COL_PO_NUMBER' },
    { key: 'supplier_name', header: 'PURCHASE.COL_SUPPLIER' },
    { key: 'item_description', header: 'PURCHASE.COL_ITEM' },
    { key: 'weight_grams', header: 'PURCHASE.COL_WEIGHT' },
    { key: 'total_cost', header: 'PURCHASE.COL_TOTAL' },
    { key: 'status', header: 'PURCHASE.COL_STATUS' },
    { key: 'actions', header: 'PURCHASE.COL_ACTIONS' },
  ];

  filteredOrders = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.orders();
    return this.orders().filter(
      (order) =>
        order.po_number.toLowerCase().includes(term) ||
        (order.supplier_name && order.supplier_name.toLowerCase().includes(term)) ||
        order.item_description.toLowerCase().includes(term),
    );
  });

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdownOrderId.set(null);
  }

  constructor() {
    // Reset pagination to first page whenever the search term changes
    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.purchaseApi.getAll().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('PURCHASE.ERROR_LOAD'));
        this.isLoading.set(false);
      },
    });
  }

  markReceived(order: PurchaseOrder) {
    this.isLoading.set(true);
    this.purchaseApi.update(order.id, { status: 'received' }).subscribe({
      next: () => this.loadOrders(),
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('PURCHASE.ERROR_UPDATE'));
        this.isLoading.set(false);
      },
    });
  }

  deleteOrder(id: string) {
    this.orderToDeleteId.set(id);
    this.showDeleteConfirmModal.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirmModal.set(false);
    this.orderToDeleteId.set(null);
  }

  executeDeleteOrder() {
    const id = this.orderToDeleteId();
    if (!id) return;

    this.isLoading.set(true);
    this.purchaseApi.delete(id).subscribe({
      next: () => {
        this.successMessage.set(this.translate.instant('PURCHASE.SUCCESS_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.orderToDeleteId.set(null);
        this.loadOrders();
        this.clearSuccessMessage();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('PURCHASE.ERROR_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.orderToDeleteId.set(null);
        this.isLoading.set(false);
      },
    });
  }

  toggleActionsDropdown(event: Event, orderId: string) {
    event.stopPropagation();
    if (this.activeDropdownOrderId() === orderId) {
      this.activeDropdownOrderId.set(null);
    } else {
      this.activeDropdownOrderId.set(orderId);
    }
  }

  clearSuccessMessage() {
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3000);
  }
}
