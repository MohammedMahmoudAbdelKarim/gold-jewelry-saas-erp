import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent, PhoneInputComponent, DEFAULT_PHONE_COUNTRY_CODE, splitPhoneNumber, combinePhoneNumber } from '@frontend/ui';
import { SuppliersApiService } from '../api/suppliers-api.service';

@Component({
  selector: 'lib-supplier-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLoaderComponent, PhoneInputComponent, TranslatePipe],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierForm implements OnInit {
  private suppliersApi = inject(SuppliersApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected languageService = inject(LanguageService);
  private translate = inject(TranslateService);

  supplierId: string | null = null;
  isEditMode = false;

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form Signals
  formCompanyName = signal<string>('');
  formContactName = signal<string>('');
  formPhoneCode = signal<string>(DEFAULT_PHONE_COUNTRY_CODE);
  formPhone = signal<string>('');
  formEmail = signal<string>('');
  formGoldReceivable = signal<number>(0);
  formCashPayable = signal<number>(0);

  ngOnInit() {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.supplierId;
    this.loadSupplierDetails();
  }

  loadSupplierDetails() {
    if (!this.isEditMode || !this.supplierId) {
      return;
    }

    this.isLoading.set(true);
    this.suppliersApi.getById(this.supplierId).subscribe({
      next: (supplier) => {
        this.formCompanyName.set(supplier.company_name);
        this.formContactName.set(supplier.contact_name || '');
        const { code, number } = splitPhoneNumber(supplier.phone);
        this.formPhoneCode.set(code);
        this.formPhone.set(number);
        this.formEmail.set(supplier.email || '');
        this.formGoldReceivable.set(supplier.gold_receivable_grams || 0);
        this.formCashPayable.set(supplier.cash_payable || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('SUPPLIERS.ERROR_NOT_FOUND'));
        this.isLoading.set(false);
      },
    });
  }

  saveSupplier() {
    const companyName = this.formCompanyName().trim();
    if (!companyName) {
      this.errorMessage.set(this.translate.instant('USERS.FILL_REQUIRED_FIELDS'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      companyName,
      contactName: this.formContactName().trim() || undefined,
      phone: combinePhoneNumber(this.formPhoneCode(), this.formPhone()) || undefined,
      email: this.formEmail().trim() || undefined,
      goldReceivableGrams: this.formGoldReceivable(),
      cashPayable: this.formCashPayable(),
    };

    if (this.isEditMode && this.supplierId) {
      this.suppliersApi.update(this.supplierId, payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('SUPPLIERS.SUCCESS_UPDATE'));
          setTimeout(() => this.router.navigate(['/suppliers']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err?.error?.message || this.translate.instant('SUPPLIERS.ERROR_UPDATE'));
          this.isLoading.set(false);
        },
      });
    } else {
      this.suppliersApi.create(payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('SUPPLIERS.SUCCESS_CREATE'));
          setTimeout(() => this.router.navigate(['/suppliers']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err?.error?.message || this.translate.instant('SUPPLIERS.ERROR_CREATE'));
          this.isLoading.set(false);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/suppliers']);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
