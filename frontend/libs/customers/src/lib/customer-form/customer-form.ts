import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent, PhoneInputComponent, DEFAULT_PHONE_COUNTRY_CODE, splitPhoneNumber, combinePhoneNumber } from '@frontend/ui';
import { CustomersApiService } from '../api/customers-api.service';

@Component({
  selector: 'lib-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLoaderComponent, PhoneInputComponent, TranslatePipe],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerForm implements OnInit {
  private customersApi = inject(CustomersApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected languageService = inject(LanguageService);
  private translate = inject(TranslateService);

  customerId: string | null = null;
  isEditMode = false;

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form Signals
  formName = signal<string>('');
  formPhoneCode = signal<string>(DEFAULT_PHONE_COUNTRY_CODE);
  formPhone = signal<string>('');
  formEmail = signal<string>('');
  formIdType = signal<string>('National ID');
  formIdNumber = signal<string>('');
  formGoldBalance = signal<number>(0);
  formCashBalance = signal<number>(0);

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.customerId;
    this.loadCustomerDetails();
  }

  loadCustomerDetails() {
    if (!this.isEditMode || !this.customerId) {
      return;
    }

    this.isLoading.set(true);
    this.customersApi.getById(this.customerId).subscribe({
      next: (customer) => {
        this.formName.set(customer.name);
        const { code, number } = splitPhoneNumber(customer.phone);
        this.formPhoneCode.set(code);
        this.formPhone.set(number);
        this.formEmail.set(customer.email || '');
        this.formIdType.set(customer.id_type || 'National ID');
        this.formIdNumber.set(customer.id_number || '');
        this.formGoldBalance.set(customer.gold_balance_grams || 0);
        this.formCashBalance.set(customer.cash_balance || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('CUSTOMERS.ERROR_NOT_FOUND'));
        this.isLoading.set(false);
      },
    });
  }

  saveCustomer() {
    const name = this.formName().trim();
    if (!name) {
      this.errorMessage.set(this.translate.instant('USERS.FILL_REQUIRED_FIELDS'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      name,
      phone: combinePhoneNumber(this.formPhoneCode(), this.formPhone()) || undefined,
      email: this.formEmail().trim() || undefined,
      idType: this.formIdType(),
      idNumber: this.formIdNumber().trim() || undefined,
      goldBalanceGrams: this.formGoldBalance(),
      cashBalance: this.formCashBalance(),
    };

    if (this.isEditMode && this.customerId) {
      this.customersApi.update(this.customerId, payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('CUSTOMERS.SUCCESS_UPDATE'));
          setTimeout(() => this.router.navigate(['/customers']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err?.error?.message || this.translate.instant('CUSTOMERS.ERROR_UPDATE'));
          this.isLoading.set(false);
        },
      });
    } else {
      this.customersApi.create(payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('CUSTOMERS.SUCCESS_CREATE'));
          setTimeout(() => this.router.navigate(['/customers']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err?.error?.message || this.translate.instant('CUSTOMERS.ERROR_CREATE'));
          this.isLoading.set(false);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/customers']);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
