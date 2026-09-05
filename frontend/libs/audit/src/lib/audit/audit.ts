import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';
import { AuditApiService } from '../api/audit-api.service';
import { AuditLogEntry } from '../models/audit.models';

@Component({
  selector: 'lib-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, SharedTableComponent, CellTemplateDirective],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Audit implements OnInit {
  private auditApi = inject(AuditApiService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  entries = signal<AuditLogEntry[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  tableColumns: TableColumn[] = [
    { key: 'created_at', header: 'AUDIT.COL_DATE' },
    { key: 'user_email', header: 'AUDIT.COL_USER' },
    { key: 'action', header: 'AUDIT.COL_ACTION' },
    { key: 'entity_type', header: 'AUDIT.COL_ENTITY' },
    { key: 'details', header: 'AUDIT.COL_DETAILS' },
  ];

  actionIcon: Record<string, string> = {
    login: 'pi-sign-in',
    create: 'pi-plus-circle',
    update: 'pi-pencil',
    delete: 'pi-trash',
  };

  filteredEntries = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.entries();
    return this.entries().filter(
      (e) =>
        e.user_email.toLowerCase().includes(term) ||
        e.action.toLowerCase().includes(term) ||
        e.entity_type.toLowerCase().includes(term) ||
        (e.details && e.details.toLowerCase().includes(term)),
    );
  });

  ngOnInit() {
    this.loadEntries();
  }

  loadEntries() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.auditApi.getAll().subscribe({
      next: (data) => {
        this.entries.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('AUDIT.ERROR_LOAD'));
        this.isLoading.set(false);
      },
    });
  }
}
