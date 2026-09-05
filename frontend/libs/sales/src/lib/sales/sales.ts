import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@frontend/auth';
import { InventoryApiService } from '@frontend/inventory';
import { SystemSettingsService, LanguageService } from '@frontend/core';
import { CustomersApiService, Customer } from '@frontend/customers';

interface CartItem {
  id: string;
  barcode: string;
  product_name: string;
  product_sku: string;
  gold_karat: string;
  gross_weight: number;
  net_gold_weight: number;
  stone_charge: number;
  pricing: {
    metalValue: number;
    makingCharge: number;
    stoneCharge: number;
    totalPrice: number;
  };
}

interface BuybackItem {
  claimedKarat: string;
  testedPurityPercent: number;
  grossWeight: number;
  netWeight: number;
  buybackRateApplied: number;
  totalValuation: number;
}

@Component({
  selector: 'lib-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private inventoryApi = inject(InventoryApiService);
  private systemSettingsService = inject(SystemSettingsService);
  private customersApi = inject(CustomersApiService);
  protected languageService = inject(LanguageService);

  // POS State
  goldRate24k = signal<number>(this.systemSettingsService.config().karat24);
  barcodeInput = signal<string>('');
  
  cartItems = signal<CartItem[]>([]);
  buybacks = signal<BuybackItem[]>([]);
  
  // Invoice configs
  customerId = signal<string>(''); // empty means walk-in
  discountAmount = signal<number>(0);
  taxRatePercent = signal<number>(this.systemSettingsService.config().taxRate);
  paymentMethod = signal<string>('cash');
  today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Loading/Error states
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successInvoice = signal<any | null>(null); // holds result of successful transaction

  // Customers (walk-in placeholder + live directory)
  customers = signal<Pick<Customer, 'id' | 'name' | 'phone'>[]>([
    { id: '', name: 'Walk-in Customer', phone: '-' },
  ]);

  karatPurities: Record<string, number> = {
    '24K': 100,
    '22K': 91.6,
    '21K': 87.5,
    '18K': 75.0
  };

  ngOnInit() {
    this.customersApi.getAll().subscribe({
      next: (data) => {
        this.customers.update((current) => [...current, ...data]);
      },
      error: (err) => console.error('Failed to load customers directory', err),
    });
  }

  scanBarcode() {
    const code = this.barcodeInput().trim();
    if (!code) return;

    this.errorMessage.set(null);
    this.inventoryApi.getItemByBarcode(code, this.goldRate24k()).subscribe({
      next: (item) => {
        if (!item) {
          this.errorMessage.set('POS.ERROR_NOT_FOUND');
          return;
        }

        // Avoid adding duplicate items to the cart
        if (this.cartItems().some(i => i.barcode === item.barcode)) {
          this.errorMessage.set('POS.ERROR_ALREADY_IN_CART');
          return;
        }

        const cartItem: CartItem = {
          id: item.id,
          barcode: item.barcode,
          product_name: item.product_name,
          product_sku: item.product_sku,
          gold_karat: item.gold_karat,
          gross_weight: parseFloat(item.gross_weight),
          net_gold_weight: parseFloat(item.net_gold_weight),
          stone_charge: parseFloat(item.stone_charge) || 0,
          pricing: {
            metalValue: item.pricing.metalValue,
            makingCharge: item.pricing.makingCharge,
            stoneCharge: item.pricing.stoneCharge,
            totalPrice: item.pricing.totalPrice,
          }
        };

        this.cartItems.update(items => [...items, cartItem]);
        this.barcodeInput.set('');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'POS.ERROR_LOOKUP');
      }
    });
  }

  removeFromCart(index: number) {
    this.cartItems.update(items => items.filter((_, i) => i !== index));
  }

  addBuybackRow() {
    const defaultKarat = '21K';
    const rate = this.calculateBuybackRate(defaultKarat);
    this.buybacks.update(items => [
      ...items,
      {
        claimedKarat: defaultKarat,
        testedPurityPercent: this.karatPurities[defaultKarat],
        grossWeight: 0,
        netWeight: 0,
        buybackRateApplied: rate,
        totalValuation: 0
      }
    ]);
  }

  removeBuybackRow(index: number) {
    this.buybacks.update(items => items.filter((_, i) => i !== index));
  }

  onBuybackKaratChange(index: number, karat: string) {
    const rate = this.calculateBuybackRate(karat);
    this.buybacks.update(items => {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        claimedKarat: karat,
        testedPurityPercent: this.karatPurities[karat],
        buybackRateApplied: rate,
        totalValuation: updated[index].netWeight * rate
      };
      return updated;
    });
  }

  onBuybackWeightChange(index: number, weight: number) {
    this.buybacks.update(items => {
      const updated = [...items];
      const rate = updated[index].buybackRateApplied;
      updated[index] = {
        ...updated[index],
        grossWeight: weight,
        netWeight: weight,
        totalValuation: weight * rate
      };
      return updated;
    });
  }

  onBuybackRateChange(index: number, rate: number) {
    this.buybacks.update(items => {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        buybackRateApplied: rate,
        totalValuation: updated[index].netWeight * rate
      };
      return updated;
    });
  }

  calculateBuybackRate(karat: string): number {
    const rate24k = this.goldRate24k();
    const purity = this.karatPurities[karat] || 100;
    return Math.round((rate24k * purity) / 100);
  }

  // Invoice calculations
  subtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.pricing.totalPrice, 0);
  });

  buybackOffset = computed(() => {
    return this.buybacks().reduce((sum, item) => sum + item.totalValuation, 0);
  });

  taxAmount = computed(() => {
    return Math.round(this.subtotal() * (this.taxRatePercent() / 100));
  });

  grandTotal = computed(() => {
    return Math.max(0, this.subtotal() + this.taxAmount() - this.discountAmount() - this.buybackOffset());
  });

  checkout() {
    if (this.cartItems().length === 0 && this.buybacks().length === 0) {
      this.errorMessage.set('POS.ERROR_EMPTY');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.errorMessage.set('AUTH.ERROR_INVALID');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      branchId: user.branchId,
      customerId: this.customerId() || undefined,
      userId: user.id,
      paymentMethod: this.paymentMethod(),
      discountAmount: this.discountAmount(),
      taxAmount: this.taxAmount(),
      items: this.cartItems().map(item => ({
        inventoryItemId: item.id,
        goldRateApplied: this.goldRate24k(),
        metalValue: item.pricing.metalValue,
        makingCharge: item.pricing.makingCharge,
        stoneCharge: item.pricing.stoneCharge,
        finalPrice: item.pricing.totalPrice
      })),
      buybacks: this.buybacks().map(b => ({
        claimedKarat: b.claimedKarat,
        testedPurityPercent: b.testedPurityPercent,
        grossWeight: b.grossWeight,
        netWeight: b.netWeight,
        buybackRateApplied: b.buybackRateApplied,
        totalValuation: b.totalValuation
      }))
    };

    this.http.post<any>('/api/sales/transactions', payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successInvoice.set(res);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'POS.ERROR_SUBMIT');
      }
    });
  }

  resetPOS() {
    this.cartItems.set([]);
    this.buybacks.set([]);
    this.discountAmount.set(0);
    this.taxRatePercent.set(this.systemSettingsService.config().taxRate);
    this.successInvoice.set(null);
    this.errorMessage.set(null);
  }
}
