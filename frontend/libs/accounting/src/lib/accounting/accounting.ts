import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';
import { AccountingApiService } from '../api/accounting-api.service';
import { AccountingOverview, LedgerEntry } from '../models/accounting.models';

@Component({
  selector: 'lib-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, SharedTableComponent, CellTemplateDirective],
  templateUrl: './accounting.html',
  styleUrl: './accounting.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Accounting implements OnInit {
  private accountingApi = inject(AccountingApiService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  overview = signal<AccountingOverview | null>(null);
  ledger = signal<LedgerEntry[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  tableColumns: TableColumn[] = [
    { key: 'date', header: 'ACCOUNTING.COL_DATE' },
    { key: 'reference', header: 'ACCOUNTING.COL_REFERENCE' },
    { key: 'description', header: 'ACCOUNTING.COL_DESCRIPTION' },
    { key: 'type', header: 'ACCOUNTING.COL_TYPE' },
    { key: 'amount', header: 'ACCOUNTING.COL_AMOUNT' },
  ];

  filteredLedger = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.ledger();
    return this.ledger().filter(
      (e) =>
        e.reference.toLowerCase().includes(term) || e.description.toLowerCase().includes(term),
    );
  });

  ngOnInit() {
    this.loadAccounting();
  }

  loadAccounting() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.accountingApi.getOverview().subscribe({
      next: (data) => this.overview.set(data),
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('ACCOUNTING.ERROR_LOAD'));
      },
    });

    this.accountingApi.getLedger().subscribe({
      next: (data) => {
        this.ledger.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('ACCOUNTING.ERROR_LOAD'));
        this.isLoading.set(false);
      },
    });
  }
}
