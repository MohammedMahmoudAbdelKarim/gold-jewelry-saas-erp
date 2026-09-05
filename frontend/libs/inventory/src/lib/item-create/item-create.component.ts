import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryApiService } from '../api/inventory.service';
import { AuthService } from '@frontend/auth';
import { PageLoaderComponent } from '@frontend/ui';

@Component({
  selector: 'app-item-create',
  imports: [CommonModule, FormsModule, TranslatePipe, PageLoaderComponent],
  templateUrl: './item-create.component.html',
  styleUrl: './item-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemCreateComponent implements OnInit {
  private apiService = inject(InventoryApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editItemId = signal<string | null>(null);
  isEditMode = computed(() => !!this.editItemId());

  // Form signals
  barcode = signal('');
  grossWeight = signal<number | null>(null);
  netGoldWeight = signal<number | null>(null);
  goldKarat = signal('21K');
  makingChargeRate = signal<number>(12);
  makingChargeType = signal('per_gram');
  stoneCharge = signal<number>(0);
  wastagePercent = signal<number>(5);
  status = signal('in_stock');

  isLoading = signal(false);
  isPageLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editItemId.set(id);
      this.loadItemDetails(id);
    }
  }

  loadItemDetails(id: string) {
    const user = this.authService.currentUser();
    if (!user || !user.branchId) return;

    this.isPageLoading.set(true);
    this.apiService.getItems(user.branchId).subscribe({
      next: (items) => {
        const item = items.find((i) => i.id === id);
        if (item) {
          this.barcode.set(item.barcode);
          this.grossWeight.set(parseFloat(item.gross_weight) || null);
          this.netGoldWeight.set(parseFloat(item.net_gold_weight) || null);
          this.goldKarat.set(item.gold_karat || '21K');
          this.makingChargeRate.set(parseFloat(item.making_charge_rate) || 0);
          this.makingChargeType.set(item.making_charge_type || 'per_gram');
          this.stoneCharge.set(parseFloat(item.stone_charge) || 0);
          this.wastagePercent.set(parseFloat(item.wastage_percent) || 0);
          this.status.set(item.status || 'in_stock');
        } else {
          this.errorMessage.set('INVENTORY.ERROR_LOAD');
        }
        this.isPageLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('INVENTORY.ERROR_LOAD');
        this.isPageLoading.set(false);
      },
    });
  }

  onSubmit() {
    const user = this.authService.currentUser();
    if (!user || !user.branchId) {
      this.errorMessage.set('AUTH.ERROR_INVALID');
      return;
    }

    if (!this.barcode() || !this.grossWeight() || !this.netGoldWeight()) {
      this.errorMessage.set('AUTH.ERROR_REQUIRED');
      return;
    }

    if ((this.netGoldWeight() || 0) > (this.grossWeight() || 0)) {
      this.errorMessage.set('INV_CREATE.ERROR_NET_EXCEEDS_GROSS');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const isEdit = this.isEditMode();

    if (isEdit) {
      const payload = {
        grossWeight: this.grossWeight(),
        netGoldWeight: this.netGoldWeight(),
        goldKarat: this.goldKarat(),
        makingChargeRate: this.makingChargeRate(),
        makingChargeType: this.makingChargeType(),
        stoneCharge: this.stoneCharge(),
        wastagePercent: this.wastagePercent(),
        status: this.status(),
      };

      this.apiService.updateItem(this.editItemId()!, payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('INV_CREATE.SUCCESS');
          setTimeout(() => {
            this.router.navigate(['/inventory/items']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'INV_CREATE.ERROR');
        },
      });
    } else {
      const payload = {
        branchId: user.branchId,
        productId: '4955c4d3-4672-4752-bf66-d3098f981e4b', // Seeded default product ID
        barcode: this.barcode().trim(),
        grossWeight: this.grossWeight(),
        netGoldWeight: this.netGoldWeight(),
        goldKarat: this.goldKarat(),
        makingChargeRate: this.makingChargeRate(),
        makingChargeType: this.makingChargeType(),
        stoneCharge: this.stoneCharge(),
        wastagePercent: this.wastagePercent(),
      };

      this.apiService.createItem(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('INV_CREATE.SUCCESS');
          setTimeout(() => {
            this.router.navigate(['/inventory/items']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'INV_CREATE.ERROR');
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/inventory/items']);
  }

  generateRandomBarcode() {
    const random = Math.floor(10000 + Math.random() * 90000);
    this.barcode.set(`RNG-21K-${random}`);
  }
}
