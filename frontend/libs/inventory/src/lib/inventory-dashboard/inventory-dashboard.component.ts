import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { InventoryApiService } from '../api/inventory.service';
import { AuthService } from '@frontend/auth';
import { SystemSettingsService } from '@frontend/core';
import { ItemsTableComponent } from '../items-table/items-table.component';
import { PageLoaderComponent } from '@frontend/ui';

@Component({
  selector: 'app-inventory-dashboard',
  imports: [CommonModule, TranslatePipe, RouterLink, ItemsTableComponent, PageLoaderComponent],
  templateUrl: './inventory-dashboard.component.html',
  styleUrl: './inventory-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryDashboardComponent {
  private apiService = inject(InventoryApiService);
  private authService = inject(AuthService);
  private systemSettingsService = inject(SystemSettingsService);

  items = signal<any[]>([]);
  isLoading = signal(false);
  
  goldRate24k = computed(() => this.systemSettingsService.config().karat24);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.branchId) {
        this.loadDashboardData(user.branchId);
      }
    });
  }

  loadDashboardData(branchId: string) {
    this.isLoading.set(true);
    this.apiService.getItems(branchId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  // Dashboard Stats Calculations
  totalPieces = computed(() => this.items().filter(i => i.status === 'in_stock').length);
  soldPieces = computed(() => this.items().filter(i => i.status === 'sold').length);

  totalGrossWeight = computed(() => {
    return this.items()
      .filter(i => i.status === 'in_stock')
      .reduce((sum, item) => sum + (parseFloat(item.gross_weight) || 0), 0);
  });

  totalNetWeight = computed(() => {
    return this.items()
      .filter(i => i.status === 'in_stock')
      .reduce((sum, item) => sum + (parseFloat(item.net_gold_weight) || 0), 0);
  });

  estimatedTotalValue = computed(() => {
    const rate = this.goldRate24k();
    return this.items()
      .filter(i => i.status === 'in_stock')
      .reduce((sum, item) => {
        const pricing = this.calculateItemValue(item, rate);
        return sum + pricing;
      }, 0);
  });

  calculateItemValue(item: any, goldPrice24k: number): number {
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

    return metalValue + makingCharge + stoneCharge;
  }
}
