import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent } from '@frontend/ui';
import { SuppliersApiService, Supplier } from '@frontend/suppliers';
import { PurchaseApiService } from '../api/purchase-api.service';
import { PurchaseOrderStatus } from '../models/purchase.models';

@Component({
  selector: 'lib-purchase-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLoaderComponent, TranslatePipe],
  templateUrl: './purchase-form.html',
  styleUrl: './purchase-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseForm implements OnInit {
  private purchaseApi = inject(PurchaseApiService);
  private suppliersApi = inject(SuppliersApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected languageService = inject(LanguageService);
  private translate = inject(TranslateService);

  orderId: string | null = null;
  isEditMode = false;

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  suppliers = signal<Supplier[]>([]);

  // Form Signals
  formSupplierId = signal<string>('');
  formItemDescription = signal<string>('');
  formGoldKarat = signal<string>('21K');
  formWeightGrams = signal<number>(0);
  formUnitCostPerGram = signal<number>(0);
  formStatus = signal<PurchaseOrderStatus>('pending');
  formNotes = signal<string>('');

  totalCost = computed(() => this.formWeightGrams() * this.formUnitCostPerGram());

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.orderId;
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.suppliersApi.getAll().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        if (!this.isEditMode && data.length > 0) {
          this.formSupplierId.set(data[0].id);
        }
        this.loadOrderDetails();
      },
      error: (err) => console.error('Failed to load suppliers', err),
    });
  }

  loadOrderDetails() {
    if (!this.isEditMode || !this.orderId) {
      return;
    }

    this.isLoading.set(true);
    this.purchaseApi.getById(this.orderId).subscribe({
      next: (order) => {
        this.formSupplierId.set(order.supplier_id);
        this.formItemDescription.set(order.item_description);
        this.formGoldKarat.set(order.gold_karat || '21K');
        this.formWeightGrams.set(order.weight_grams);
        this.formUnitCostPerGram.set(order.unit_cost_per_gram);
        this.formStatus.set(order.status);
        this.formNotes.set(order.notes || '');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('PURCHASE.ERROR_NOT_FOUND'));
        this.isLoading.set(false);
      },
    });
  }

  saveOrder() {
    const itemDescription = this.formItemDescription().trim();
    if (!this.formSupplierId() || !itemDescription || this.formWeightGrams() <= 0) {
      this.errorMessage.set(this.translate.instant('USERS.FILL_REQUIRED_FIELDS'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.isEditMode && this.orderId) {
      const payload = {
        itemDescription,
        goldKarat: this.formGoldKarat(),
        weightGrams: this.formWeightGrams(),
        unitCostPerGram: this.formUnitCostPerGram(),
        status: this.formStatus(),
        notes: this.formNotes().trim() || undefined,
      };
      this.purchaseApi.update(this.orderId, payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('PURCHASE.SUCCESS_UPDATE'));
          setTimeout(() => this.router.navigate(['/purchase']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err?.error?.message || this.translate.instant('PURCHASE.ERROR_UPDATE'));
          this.isLoading.set(false);
        },
      });
    } else {
      const payload = {
        supplierId: this.formSupplierId(),
        itemDescription,
        goldKarat: this.formGoldKarat(),
        weightGrams: this.formWeightGrams(),
        unitCostPerGram: this.formUnitCostPerGram(),
        notes: this.formNotes().trim() || undefined,
      };
      this.purchaseApi.create(payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('PURCHASE.SUCCESS_CREATE'));
          setTimeout(() => this.router.navigate(['/purchase']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err?.error?.message || this.translate.instant('PURCHASE.ERROR_CREATE'));
          this.isLoading.set(false);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/purchase']);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
