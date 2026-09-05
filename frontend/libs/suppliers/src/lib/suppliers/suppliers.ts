import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';
import { SuppliersApiService } from '../api/suppliers-api.service';
import { Supplier } from '../models/suppliers.models';

@Component({
  selector: 'lib-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    RouterModule,
    SharedTableComponent,
    CellTemplateDirective,
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Suppliers implements OnInit {
  private suppliersApi = inject(SuppliersApiService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  suppliers = signal<Supplier[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Custom Delete Confirm modal
  showDeleteConfirmModal = signal<boolean>(false);
  supplierToDeleteId = signal<string | null>(null);

  // Actions Dropdown state
  activeDropdownSupplierId = signal<string | null>(null);

  tableColumns: TableColumn[] = [
    { key: 'company_name', header: 'SUPPLIERS.COL_COMPANY' },
    { key: 'phone', header: 'SUPPLIERS.COL_PHONE' },
    { key: 'contact_name', header: 'SUPPLIERS.COL_CONTACT' },
    { key: 'gold_receivable_grams', header: 'SUPPLIERS.COL_GOLD_RECEIVABLE' },
    { key: 'cash_payable', header: 'SUPPLIERS.COL_CASH_PAYABLE' },
    { key: 'actions', header: 'SUPPLIERS.COL_ACTIONS' },
  ];

  filteredSuppliers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.suppliers();
    return this.suppliers().filter(
      (supplier) =>
        supplier.company_name.toLowerCase().includes(term) ||
        (supplier.contact_name && supplier.contact_name.toLowerCase().includes(term)) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(term)) ||
        (supplier.email && supplier.email.toLowerCase().includes(term)),
    );
  });

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdownSupplierId.set(null);
  }

  constructor() {
    // Reset pagination to first page whenever the search term changes
    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.suppliersApi.getAll().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('SUPPLIERS.ERROR_LOAD'));
        this.isLoading.set(false);
      },
    });
  }

  deleteSupplier(id: string) {
    this.supplierToDeleteId.set(id);
    this.showDeleteConfirmModal.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirmModal.set(false);
    this.supplierToDeleteId.set(null);
  }

  executeDeleteSupplier() {
    const id = this.supplierToDeleteId();
    if (!id) return;

    this.isLoading.set(true);
    this.suppliersApi.delete(id).subscribe({
      next: () => {
        this.successMessage.set(this.translate.instant('SUPPLIERS.SUCCESS_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.supplierToDeleteId.set(null);
        this.loadSuppliers();
        this.clearSuccessMessage();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('SUPPLIERS.ERROR_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.supplierToDeleteId.set(null);
        this.isLoading.set(false);
      },
    });
  }

  toggleActionsDropdown(event: Event, supplierId: string) {
    event.stopPropagation();
    if (this.activeDropdownSupplierId() === supplierId) {
      this.activeDropdownSupplierId.set(null);
    } else {
      this.activeDropdownSupplierId.set(supplierId);
    }
  }

  clearSuccessMessage() {
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3000);
  }
}
