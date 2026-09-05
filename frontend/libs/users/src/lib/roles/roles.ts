import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn, PageLoaderComponent } from '@frontend/ui';

@Component({
  selector: 'lib-roles-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe, SharedTableComponent, CellTemplateDirective, PageLoaderComponent],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesList implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  protected languageService = inject(LanguageService);
  protected translate = inject(TranslateService);

  translateRole(roleName: string): string {
    if (!roleName) return '';
    const key = `ROLE_NAMES.${roleName}`;
    const translated = this.translate.instant(key);
    return translated === key ? roleName : translated;
  }

  tableColumns: TableColumn[] = [
    { key: 'roleName', header: 'ROLES.COL_ROLE_NAME' },
    { key: 'type', header: 'ROLES.COL_TYPE' },
    { key: 'permissions', header: 'ROLES.COL_PERMISSIONS' },
    { key: 'scopes', header: 'ROLES.COL_SCOPES' },
    { key: 'actions', header: 'ROLES.COL_ACTIONS', align: 'center' }
  ];

  // Data
  roles = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Filters
  searchQuery = signal<string>('');
  selectedTypeFilter = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Dropdown
  activeDropdownRoleId = signal<string | null>(null);

  // Stats
  totalRolesCount = computed(() => this.roles().length);
  systemRolesCount = computed(() => this.roles().filter(r => this.isSystemRole(r.name)).length);
  customRolesCount = computed(() => this.roles().filter(r => !this.isSystemRole(r.name)).length);
  totalPermissions = computed(() => {
    const all = new Set<string>();
    this.roles().forEach(r => (r.permissions || []).forEach((p: string) => all.add(p)));
    return all.size;
  });

  // Filtered
  filteredRoles = computed(() => {
    let list = this.roles();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(r => r.name.toLowerCase().includes(q));
    }
    const type = this.selectedTypeFilter();
    if (type === 'system') {
      list = list.filter(r => this.isSystemRole(r.name));
    } else if (type === 'custom') {
      list = list.filter(r => !this.isSystemRole(r.name));
    }
    return list;
  });



  ngOnInit() {
    this.loadRoles();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdownRoleId.set(null);
  }

  loadRoles() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<any[]>('/api/auth/roles').subscribe({
      next: (res) => {
        this.roles.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('ROLES.LOAD_ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  toggleActionsDropdown(event: Event, roleId: string) {
    event.stopPropagation();
    this.activeDropdownRoleId.update(current => current === roleId ? null : roleId);
  }

  deleteRole(roleId: string) {
    this.activeDropdownRoleId.set(null);
    this.isLoading.set(true);
    this.http.delete(`/api/auth/roles/${roleId}`).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('ROLES.DELETE_SUCCESS'));
        this.loadRoles();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || this.translate.instant('ROLES.DELETE_ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  isSystemRole(roleName: string): boolean {
    const systemRoles = ['Owner', 'Branch Manager', 'Sales / Cashier', 'Inventory Officer', 'Purchasing Officer', 'Accountant', 'Auditor', 'Support / Admin', 'Viewer'];
    return systemRoles.includes(roleName);
  }

  getPermissionCount(role: any): number {
    return role.permissions ? role.permissions.length : 0;
  }



  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
