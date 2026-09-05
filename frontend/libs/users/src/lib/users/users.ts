import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@frontend/auth';
import { LanguageService } from '@frontend/core';
import { SharedTableComponent, CellTemplateDirective, TableColumn } from '@frontend/ui';

@Component({
  selector: 'lib-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, RouterModule, SharedTableComponent, CellTemplateDirective],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users implements OnInit {
  private http = inject(HttpClient);
  protected authService = inject(AuthService);
  protected languageService = inject(LanguageService);
  private translate = inject(TranslateService);

  tableColumns: TableColumn[] = [
    { key: 'employee', header: 'USERS.COL_EMPLOYEE' },
    { key: 'role', header: 'USERS.COL_ROLE' },
    { key: 'branch', header: 'USERS.COL_ASSIGNED_BRANCH' },
    { key: 'status', header: 'USERS.COL_STATUS' },
    { key: 'actions', header: 'USERS.COL_ACTIONS', align: 'center' }
  ];

  // States
  users = signal<any[]>([]);
  roles = signal<any[]>([]);
  branches = signal<any[]>([]);
  searchQuery = signal<string>('');
  selectedRoleFilter = signal<string>('');
  selectedBranchFilter = signal<string>('');
  showDeleteConfirmModal = signal<boolean>(false);
  userToDeleteId = signal<string | null>(null);

  // Dropdown actions state
  activeDropdownUserId = signal<string | null>(null);

  // Pagination states
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // UI Control
  showModal = signal<boolean>(false);
  editingUser = signal<any | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form inputs
  formName = signal<string>('');
  formEmail = signal<string>('');
  formPassword = signal<string>('');
  formRoleId = signal<string>('');
  formHomeBranchId = signal<string>('');

  constructor() {
    // Reset pagination to first page when search or filters change
    effect(() => {
      this.searchQuery();
      this.selectedRoleFilter();
      this.selectedBranchFilter();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Load users
    this.http.get<any[]>('/api/auth/users').subscribe({
      next: (res) => {
        this.users.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load users: ' + (err.error?.message || err.message));
        this.isLoading.set(false);
      }
    });

    // Load roles
    this.http.get<any[]>('/api/auth/roles').subscribe({
      next: (res) => this.roles.set(res),
      error: (err) => console.error('Failed to load roles', err)
    });

    // Load branches
    this.http.get<any[]>('/api/auth/branches').subscribe({
      next: (res) => this.branches.set(res),
      error: (err) => console.error('Failed to load branches', err)
    });
  }

  // Filtered users computed
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const roleId = this.selectedRoleFilter();
    const branchId = this.selectedBranchFilter();

    return this.users().filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = !roleId || user.role_id === roleId;
      const matchesBranch = !branchId || user.home_branch_id === branchId;

      return matchesSearch && matchesRole && matchesBranch;
    });
  });



  getRoleClass(roleName: string): string {
    if (!roleName) return 'viewer';
    return roleName.toLowerCase()
      .replace(/\s*\/\s*/g, '-')
      .replace(/\s+/g, '-');
  }

  toggleActionsDropdown(event: Event, userId: string) {
    event.stopPropagation();
    if (this.activeDropdownUserId() === userId) {
      this.activeDropdownUserId.set(null);
    } else {
      this.activeDropdownUserId.set(userId);
    }
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.activeDropdownUserId.set(null);
  }

  // Summary stats
  totalUsersCount = computed(() => this.users().length);
  activeAdmins = computed(() => this.users().filter((u) => (u.role_name === 'Support / Admin' || u.role_name === 'Admin') && u.is_active).length);
  activeSales = computed(() => this.users().filter((u) => (u.role_name === 'Sales / Cashier' || u.role_name === 'Sales Associate') && u.is_active).length);
  activeManagers = computed(() => this.users().filter((u) => (u.role_name === 'Branch Manager' || u.role_name === 'Manager') && u.is_active).length);



  toggleUserStatus(user: any) {
    this.isLoading.set(true);
    this.http.put(`/api/auth/users/${user.id}`, { isActive: !user.is_active }).subscribe({
      next: () => {
        this.showSuccess(`User status updated to ${!user.is_active ? 'Active' : 'Suspended'}.`);
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to toggle status.');
        this.isLoading.set(false);
      }
    });
  }

  deleteUser(userId: string) {
    this.userToDeleteId.set(userId);
    this.showDeleteConfirmModal.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirmModal.set(false);
    this.userToDeleteId.set(null);
  }

  executeDeleteUser() {
    const userId = this.userToDeleteId();
    if (!userId) return;

    this.isLoading.set(true);
    this.http.delete(`/api/auth/users/${userId}`).subscribe({
      next: () => {
        this.showSuccess('User deleted successfully.');
        this.showDeleteConfirmModal.set(false);
        this.userToDeleteId.set(null);
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete user.');
        this.showDeleteConfirmModal.set(false);
        this.userToDeleteId.set(null);
        this.isLoading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  translateRole(roleName: string): string {
    if (!roleName) return '';
    const key = `ROLE_NAMES.${roleName}`;
    const translated = this.translate.instant(key);
    return translated === key ? roleName : translated;
  }

  private showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
