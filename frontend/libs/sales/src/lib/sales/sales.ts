import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { SystemSettingsService, LanguageService, AuthService } from '@frontend/core';
import { InventoryApiService } from '@frontend/inventory';
import { CustomersApiService, Customer } from '@frontend/customers';

export interface CartItem {
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

export interface BuybackItem {
  claimedKarat: string;
  testedPurityPercent: number;
  grossWeight: number;
  netWeight: number;
  buybackRateApplied: number;
  totalValuation: number;
}

export interface QuickCatalogItem {
  barcode: string;
  name: string;
  name_ar: string;
  karat: string;
  weight: number;
  icon: string;
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
  goldRate24k = signal<number>(this.systemSettingsService.config().karat24 || 3850);
  barcodeInput = signal<string>('');
  
  cartItems = signal<CartItem[]>([]);
  buybacks = signal<BuybackItem[]>([]);
  
  // Invoice configs
  customerId = signal<string>(''); // empty means walk-in
  discountAmount = signal<number>(0);
  taxRatePercent = signal<number>(this.systemSettingsService.config().taxRate || 14);
  paymentMethod = signal<string>('cash');
  cashReceived = signal<number | null>(null);
  
  today = new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
  todayEn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Loading/Error states
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successInvoice = signal<any | null>(null); // holds result of successful transaction

  // Customers (walk-in placeholder + live directory)
  customers = signal<Pick<Customer, 'id' | 'name' | 'phone'>[]>([
    { id: '', name: 'Walk-in Customer', phone: '-' },
  ]);

  // Quick Catalog for 1-Click Fast Selling & Testing
  quickCatalog: QuickCatalogItem[] = [
    { barcode: 'RNG-21K-00941', name: 'Golden Band Ring', name_ar: 'خاتم كلاسيك عيار 21', karat: '21K', weight: 8.5, icon: 'pi-circle' },
    { barcode: 'NKL-22K-01050', name: 'Rope Chain Necklace', name_ar: 'سلسلة حبل عيار 22', karat: '22K', weight: 25.0, icon: 'pi-link' },
    { barcode: 'BRC-18K-00733', name: 'Diamond Accent Bracelet', name_ar: 'إسوارة ألماس عيار 18', karat: '18K', weight: 18.0, icon: 'pi-star' },
    { barcode: 'EAR-24K-00215', name: 'Pure Gold Drop Earrings', name_ar: 'حلق قطرة عيار 24', karat: '24K', weight: 5.2, icon: 'pi-sparkles' },
    { barcode: 'PND-21K-00860', name: 'Ruby Heart Pendant', name_ar: 'دلاية ياقوت عيار 21', karat: '21K', weight: 6.8, icon: 'pi-heart' },
  ];

  karatPurities: Record<string, number> = {
    '24K': 100,
    '22K': 91.6,
    '21K': 87.5,
    '18K': 75.0
  };

  // Computed Rates for Quick Glance
  goldRate21k = computed(() => Math.round(this.goldRate24k() * 0.875));
  goldRate18k = computed(() => Math.round(this.goldRate24k() * 0.75));

  // Current User / Branch context
  currentUser = computed(() => this.authService.currentUser());
  currentBranchName = computed(() => (this.currentUser() as any)?.branch_name || (this.currentUser() as any)?.branchName || 'Cairo HQ Branch');

  selectedCustomerName = computed(() => {
    const id = this.customerId();
    if (!id) return null;
    const found = this.customers().find(c => c.id === id);
    return found ? found.name : null;
  });

  totalNetWeight = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + (item.net_gold_weight || 0), 0);
  });

  totalGrossWeight = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + (item.gross_weight || 0), 0);
  });

  totalBuybackWeight = computed(() => {
    return this.buybacks().reduce((sum, item) => sum + (item.netWeight || 0), 0);
  });

  ngOnInit() {
    this.customersApi.getAll().subscribe({
      next: (data) => {
        this.customers.update((current) => [...current, ...data]);
      },
      error: (err) => console.error('Failed to load customers directory', err),
    });
  }

  scanBarcode(customCode?: string) {
    const code = (customCode || this.barcodeInput()).trim();
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

        const netWeight = parseFloat(item.net_gold_weight) || parseFloat(item.gross_weight) || 5.0;
        const purity = (this.karatPurities[item.gold_karat] || 87.5) / 100;
        const metalValue = item.pricing?.metalValue ?? Math.round(netWeight * (this.goldRate24k() * purity));
        const makingCharge = item.pricing?.makingCharge ?? Math.round(netWeight * (parseFloat(item.making_charge_rate) || 250));
        const stoneCharge = item.pricing?.stoneCharge ?? (parseFloat(item.stone_charge) || 0);
        const totalPrice = item.pricing?.totalPrice ?? (metalValue + makingCharge + stoneCharge);

        const cartItem: CartItem = {
          id: item.id || `item-${Date.now()}`,
          barcode: item.barcode,
          product_name: item.product_name,
          product_sku: item.product_sku || item.barcode,
          gold_karat: item.gold_karat,
          gross_weight: parseFloat(item.gross_weight) || netWeight,
          net_gold_weight: netWeight,
          stone_charge: stoneCharge,
          pricing: {
            metalValue,
            makingCharge,
            stoneCharge,
            totalPrice,
          }
        };

        this.cartItems.update(items => [cartItem, ...items]);
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

  clearCart() {
    this.cartItems.set([]);
    this.buybacks.set([]);
    this.errorMessage.set(null);
  }

  addBuybackRow() {
    const defaultKarat = '21K';
    const rate = this.calculateBuybackRate(defaultKarat);
    this.buybacks.update(items => [
      ...items,
      {
        claimedKarat: defaultKarat,
        testedPurityPercent: this.karatPurities[defaultKarat],
        grossWeight: 5.0,
        netWeight: 5.0,
        buybackRateApplied: rate,
        totalValuation: 5.0 * rate
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
        totalValuation: Math.round(updated[index].netWeight * rate)
      };
      return updated;
    });
  }

  onBuybackWeightChange(index: number, weight: number) {
    const w = weight || 0;
    this.buybacks.update(items => {
      const updated = [...items];
      const rate = updated[index].buybackRateApplied;
      updated[index] = {
        ...updated[index],
        grossWeight: w,
        netWeight: w,
        totalValuation: Math.round(w * rate)
      };
      return updated;
    });
  }

  calculateBuybackRate(karat: string): number {
    const rate24k = this.goldRate24k();
    const purity = this.karatPurities[karat] || 100;
    return Math.round((rate24k * purity) / 100);
  }

  setPaymentMethod(method: string) {
    this.paymentMethod.set(method);
  }

  // Invoice calculations
  subtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.pricing.totalPrice, 0);
  });

  buybackOffset = computed(() => {
    return this.buybacks().reduce((sum, item) => sum + item.totalValuation, 0);
  });

  taxAmount = computed(() => {
    const taxableAmount = Math.max(0, this.subtotal() - this.discountAmount());
    return Math.round(taxableAmount * (this.taxRatePercent() / 100));
  });

  grandTotal = computed(() => {
    return Math.max(0, this.subtotal() + this.taxAmount() - this.discountAmount() - this.buybackOffset());
  });

  changeDue = computed(() => {
    const received = this.cashReceived();
    const total = this.grandTotal();
    if (received === null || received <= total) return 0;
    return received - total;
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
      branchId: user.branchId || 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
      customerId: this.customerId() || undefined,
      customerName: this.selectedCustomerName() || 'عميل نقدي (حساب افتراضي)',
      userId: user.id,
      paymentMethod: this.paymentMethod(),
      discountAmount: this.discountAmount(),
      taxAmount: this.taxAmount(),
      subtotal: this.subtotal(),
      total_amount: this.grandTotal(),
      items: this.cartItems().map(item => ({
        inventoryItemId: item.id,
        barcode: item.barcode,
        product_name: item.product_name,
        gold_karat: item.gold_karat,
        gross_weight: item.gross_weight,
        net_gold_weight: item.net_gold_weight,
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
    this.cashReceived.set(null);
    this.taxRatePercent.set(this.systemSettingsService.config().taxRate || 14);
    this.successInvoice.set(null);
    this.errorMessage.set(null);
  }
}

