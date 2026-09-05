import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { InventoryApiService } from '../api/inventory.service';
import { AuthService } from '@frontend/auth';
import { SystemSettingsService, LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';

@Component({
  selector: 'app-items-table',
  imports: [CommonModule, FormsModule, TranslatePipe, SharedTableComponent, CellTemplateDirective],
  templateUrl: './items-table.component.html',
  styleUrl: './items-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsTableComponent {
  private apiService = inject(InventoryApiService);
  private authService = inject(AuthService);
  public systemSettingsService = inject(SystemSettingsService);
  public languageService = inject(LanguageService);
  private router = inject(Router);
  Math = Math;

  activeDropdownItemId = signal<string | null>(null);
  actionLoadingItemId = signal<string | null>(null);

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdownItemId.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isDeleteConfirmOpen()) {
      this.closeDeleteConfirm();
    }
    this.activeDropdownItemId.set(null);
  }

  toggleActionsDropdown(event: Event, itemId: string) {
    event.stopPropagation();
    this.activeDropdownItemId.update(current => current === itemId ? null : itemId);
  }

  tableColumns: TableColumn[] = [
    { key: 'barcode', header: 'INVENTORY.COL_BARCODE' },
    { key: 'name', header: 'INVENTORY.COL_NAME' },
    { key: 'karat', header: 'INVENTORY.COL_KARAT' },
    { key: 'gross_weight', header: 'INVENTORY.COL_WEIGHT' },
    { key: 'net_gold_weight', header: 'INVENTORY.COL_NET_WEIGHT' },
    { key: 'wastage', header: 'INV_CREATE.WASTAGE' },
    { key: 'making_charge', header: 'INVENTORY.COL_MAKING_CHARGE' },
    { key: 'stone_charge', header: 'INV_CREATE.STONE_CHARGE' },
    { key: 'status', header: 'INVENTORY.COL_STATUS', type: 'status' },
    { key: 'total_price', header: 'INVENTORY.COL_VALUE', align: 'right' },
    { key: 'actions', header: 'INVENTORY.COL_ACTIONS', align: 'center' }
  ];

  showHeader = input<boolean>(true);

  items = signal<any[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Live input values
  goldRate24k = signal<number>(this.systemSettingsService.config().karat24); // default live 24k rate from system settings
  searchQuery = signal<string>('');
  karatFilter = signal<string>('ALL');
  statusFilter = signal<string>('ALL');

  // Pagination signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);
  pageSizeOptions = [5, 10, 20, 50];

  // Confirm delete dialog signals
  isDeleteConfirmOpen = signal(false);
  deleteTargetItem = signal<any>(null);
  isDeleting = signal(false);

  constructor() {
    // Reload items when the user's active branch is set
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.branchId) {
        this.loadInventory(user.branchId);
      }
    });

    // Reset pagination to page 1 on filter changes
    effect(() => {
      this.searchQuery();
      this.karatFilter();
      this.statusFilter();
      this.pageSize();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  loadInventory(branchId: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.apiService.getItems(branchId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('INVENTORY.ERROR_LOAD');
        this.isLoading.set(false);
      },
    });
  }

  // Calculated items with live pricing and filters applied
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const karat = this.karatFilter();
    const status = this.statusFilter();
    const rate24k = this.goldRate24k();

    return this.items()
      .filter((item) => {
        // Search filter
        const barcodeMatch = item.barcode?.toLowerCase().includes(query);
        const nameMatch = item.product_name?.toLowerCase().includes(query);
        const skuMatch = item.product_sku?.toLowerCase().includes(query);
        const matchesSearch = !query || barcodeMatch || nameMatch || skuMatch;

        // Karat filter
        const matchesKarat = karat === 'ALL' || item.gold_karat === karat;

        // Status filter
        const matchesStatus = status === 'ALL' || item.status === status;

        return matchesSearch && matchesKarat && matchesStatus;
      })
      .map((item) => {
        // Dynamic price calculation
        const pricing = this.calculateItemPricing(item, rate24k);
        return {
          ...item,
          pricing,
        };
      });
  });



  calculateItemPricing(item: any, goldPrice24k: number) {
    const grossWeight = parseFloat(item.gross_weight) || 0;
    const netGoldWeight = parseFloat(item.net_gold_weight) || 0;
    const stoneCharge = parseFloat(item.stone_charge) || 0;
    const makingChargeRate = parseFloat(item.making_charge_rate) || 0;
    const wastagePercent = parseFloat(item.wastage_percent) || 0;

    let purityMultiplier = 0;
    const karatStr = item.gold_karat ? item.gold_karat.toUpperCase() : '21K';
    if (karatStr.includes('24K')) purityMultiplier = 1.0;
    else if (karatStr.includes('22K')) purityMultiplier = 22.0 / 24.0;
    else if (karatStr.includes('21K')) purityMultiplier = 21.0 / 24.0;
    else if (karatStr.includes('18K')) purityMultiplier = 18.0 / 24.0;

    const karatRateApplied = goldPrice24k * purityMultiplier;
    const wastageWeight = netGoldWeight * (wastagePercent / 100);
    const metalValue = (netGoldWeight + wastageWeight) * karatRateApplied;

    let makingCharge = 0;
    if (item.making_charge_type === 'fixed') {
      makingCharge = makingChargeRate;
    } else {
      makingCharge = makingChargeRate * grossWeight;
    }

    const totalPrice = metalValue + makingCharge + stoneCharge;

    return {
      metalValue,
      makingCharge,
      totalPrice,
    };
  }

  // Action methods
  openDeleteConfirm(item: any) {
    this.deleteTargetItem.set(item);
    this.isDeleteConfirmOpen.set(true);
    this.activeDropdownItemId.set(null);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.deleteTargetItem.set(null);
  }

  confirmDelete() {
    const item = this.deleteTargetItem();
    if (!item) return;

    this.isDeleting.set(true);
    this.apiService.deleteItem(item.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.isDeleteConfirmOpen.set(false);
        this.deleteTargetItem.set(null);
        const user = this.authService.currentUser();
        if (user && user.branchId) {
          this.loadInventory(user.branchId);
        }
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.errorMessage.set('INVENTORY.ERROR_LOAD');
        this.isDeleteConfirmOpen.set(false);
      }
    });
  }

  editItem(item: any) {
    this.activeDropdownItemId.set(null);
    this.router.navigate(['/inventory/items/edit', item.id]);
  }

  toggleReservedStatus(item: any) {
    const nextStatus = item.status === 'reserved' ? 'in_stock' : 'reserved';
    this.actionLoadingItemId.set(item.id);
    this.activeDropdownItemId.set(null);
    
    this.apiService.updateItem(item.id, { status: nextStatus }).subscribe({
      next: () => {
        this.actionLoadingItemId.set(null);
        const user = this.authService.currentUser();
        if (user && user.branchId) {
          this.loadInventory(user.branchId);
        }
      },
      error: (err) => {
        this.actionLoadingItemId.set(null);
        this.errorMessage.set('INVENTORY.ERROR_LOAD');
      }
    });
  }


}
