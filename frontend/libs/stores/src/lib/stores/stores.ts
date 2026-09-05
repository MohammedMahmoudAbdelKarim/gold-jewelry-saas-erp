import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';

@Component({
  selector: 'lib-stores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    RouterModule,
    SharedTableComponent,
    CellTemplateDirective,
  ],
  templateUrl: './stores.html',
  styleUrl: './stores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stores implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  stores = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Custom Delete Confirm modal
  showDeleteConfirmModal = signal<boolean>(false);
  storeToDeleteId = signal<string | null>(null);

  // Actions Dropdown state
  activeDropdownStoreId = signal<string | null>(null);

  tableColumns: TableColumn[] = [
    { key: 'name', header: 'STORES.COL_NAME' },
    { key: 'branch_type', header: 'STORES.COL_TYPE' },
    { key: 'location', header: 'STORES.COL_LOCATION' },
    { key: 'is_active', header: 'STORES.COL_STATUS' },
    { key: 'actions', header: 'STORES.COL_ACTIONS' }
  ];

  filteredStores = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.stores();
    return this.stores().filter(store => 
      store.name.toLowerCase().includes(term) ||
      (store.location && store.location.toLowerCase().includes(term))
    );
  });

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdownStoreId.set(null);
  }

  constructor() {
    // Reset pagination to first page whenever the search term changes
    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadStores();
  }

  loadStores() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.http.get<any[]>('/api/auth/branches').subscribe({
      next: (data) => {
        this.stores.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('STORES.ERROR_LOAD'));
        this.isLoading.set(false);
      }
    });
  }

  deleteStore(id: string) {
    this.storeToDeleteId.set(id);
    this.showDeleteConfirmModal.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirmModal.set(false);
    this.storeToDeleteId.set(null);
  }

  executeDeleteStore() {
    const id = this.storeToDeleteId();
    if (!id) return;

    this.isLoading.set(true);
    this.http.delete(`/api/auth/branches/${id}`).subscribe({
      next: () => {
        this.successMessage.set(this.translate.instant('STORES.SUCCESS_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.storeToDeleteId.set(null);
        this.loadStores();
        this.clearSuccessMessage();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('STORES.ERROR_DELETE'));
        this.showDeleteConfirmModal.set(false);
        this.storeToDeleteId.set(null);
        this.isLoading.set(false);
      }
    });
  }

  toggleStoreStatus(store: any) {
    this.isLoading.set(true);
    const payload = {
      name: store.name,
      branchType: store.branch_type || 'retail',
      location: store.location || '',
      isActive: !store.is_active
    };

    this.http.put(`/api/auth/branches/${store.id}`, payload).subscribe({
      next: () => {
        this.loadStores();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('STORES.ERROR_TOGGLE'));
        this.isLoading.set(false);
      }
    });
  }

  toggleActionsDropdown(event: Event, storeId: string) {
    event.stopPropagation();
    if (this.activeDropdownStoreId() === storeId) {
      this.activeDropdownStoreId.set(null);
    } else {
      this.activeDropdownStoreId.set(storeId);
    }
  }

  clearSuccessMessage() {
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3000);
  }
}
