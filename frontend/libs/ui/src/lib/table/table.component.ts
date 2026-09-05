import { Component, ContentChildren, QueryList, TemplateRef, input, model, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { CellTemplateDirective } from './cell-template.directive';
import { PageLoaderComponent } from '../page-loader/page-loader.component';

export interface TableColumn {
  key: string;
  header: string; // Translation key
  type?: 'text' | 'number' | 'currency' | 'status' | 'custom';
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, PageLoaderComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class SharedTableComponent {
  public languageService = inject(LanguageService);
  Math = Math;

  data = input<any[]>([]);
  columns = input<TableColumn[]>([]);
  isLoading = input<boolean>(false);
  errorMessage = input<string | null>(null);
  noItemsMessage = input<string>('INVENTORY.NO_ITEMS');

  // Pagination signals
  currentPage = model<number>(1);
  pageSize = model<number>(5);
  pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  @ContentChildren(CellTemplateDirective) cellTemplates!: QueryList<CellTemplateDirective>;

  // Computed page slice
  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.data().slice(start, end);
  });

  totalPages = computed(() => {
    const total = this.data().length;
    return Math.ceil(total / this.pageSize()) || 1;
  });

  pageNumbers = computed(() => {
    const pages: number[] = [];
    const total = this.totalPages();
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });

  getTemplate(columnName: string): TemplateRef<any> | null {
    return this.cellTemplates?.find((t) => t.columnName === columnName)?.templateRef || null;
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  setPage(page: number) {
    this.currentPage.set(page);
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.currentPage.set(1);
  }

  getStatusLabel(status: any): string {
    if (status === 'in_stock' || status === 'active' || status === true) {
      return 'INVENTORY.STATUS_AVAILABLE';
    } else if (status === 'reserved') {
      return 'INVENTORY.STATUS_RESERVED';
    } else if (status === 'sold' || status === 'suspended' || status === false) {
      return 'INVENTORY.STATUS_SOLD';
    }
    return String(status);
  }
}
