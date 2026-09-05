import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';
import { CustomersApiService } from '../api/customers-api.service';
import { Customer } from '../models/customers.models';

@Component({
  selector: 'lib-customers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    RouterModule,
    SharedTableComponent,
    CellTemplateDirective,
  ],
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Customers implements OnInit {
  private customersApi = inject(CustomersApiService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  customers = signal<Customer[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Custom Delete Confirm modal
  showDeleteConfirmModal = signal<boolean>(false);
  customerToDeleteId = signal<string | null>(null);

  // Actions Dropdown state
  activeDropdownCustomerId = signal<string | null>(null);

  tableColumns: TableColumn[] = [
    { key: 'name', header: 'CUSTOMERS.COL_NAME' },
    { key: 'phone', header: 'CUSTOMERS.COL_PHONE' },
    { key: 'id_number', header: 'CUSTOMERS.COL_ID' },
    { key: 'gold_balance_grams', header: 'CUSTOMERS.COL_GOLD_BALANCE' },
    { key: 'cash_balance', header: 'CUSTOMERS.COL_CASH_BALANCE' },
    { key: 'actions', header: 'CUSTOMERS.COL_ACTIONS' },
  ];

  filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.customers();
    return this.customers().filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        (customer.phone && customer.phone.toLowerCase().includes(term)) ||
        (customer.email && customer.email.toLowerCase().includes(term)) ||
        (customer.id_number && customer.id_number.toLowerCase().includes(term)),
    );
  });

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdownCustomerId.set(null);
  }

  constructor() {
    // Reset pagination to first page whenever the search term changes
    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.customersApi.getAll().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('CUSTOMERS.ERROR_LOAD'));
        this.isLoading.set(false);
      },
    });
  }

  deleteCustomer(id: string) {
    this.customerToDeleteId.set(id);
    this.showDeleteConfirmModal.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirmModal.set(false);
    this.customerToDeleteId.set(null);
  }

  executeDeleteCustomer() {
    const id = this.customerToDeleteId();
    if (!id) return;

    this.isLoading.set(true);
    this.customersApi.delete(id).subscribe({
      next: () => {
        this.successMessage.set(this.translate.instant('CUSTOMERS.SUCCESS_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.customerToDeleteId.set(null);
        this.loadCustomers();
        this.clearSuccessMessage();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('CUSTOMERS.ERROR_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.customerToDeleteId.set(null);
        this.isLoading.set(false);
      },
    });
  }

  toggleActionsDropdown(event: Event, customerId: string) {
    event.stopPropagation();
    if (this.activeDropdownCustomerId() === customerId) {
      this.activeDropdownCustomerId.set(null);
    } else {
      this.activeDropdownCustomerId.set(customerId);
    }
  }

  clearSuccessMessage() {
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3000);
  }
}
