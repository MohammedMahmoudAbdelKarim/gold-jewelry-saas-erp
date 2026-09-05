import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent } from '@frontend/ui';

interface PermissionItem {
  name: string;
  labelKey: string;
  checked: boolean;
}

interface ModulePermissions {
  moduleKey: string;
  icon: string;
  permissions: PermissionItem[];
}

@Component({
  selector: 'lib-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe, PageLoaderComponent],
  templateUrl: './role-form.html',
  styleUrl: './role-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleForm implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected languageService = inject(LanguageService);
  protected translate = inject(TranslateService);

  // Parameters
  roleId: string | null = null;
  isEditMode = false;

  // States
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form Signals
  formName = signal<string>('');

  // Permission Matrix — uses translation keys for labels
  matrix = signal<ModulePermissions[]>([
    {
      moduleKey: 'ROLES.MOD_DASHBOARD',
      icon: 'pi-home',
      permissions: [
        { name: 'Dashboard.View', labelKey: 'ROLES.PERM_DASHBOARD_VIEW', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_SALES',
      icon: 'pi-shopping-cart',
      permissions: [
        { name: 'Sales.View', labelKey: 'ROLES.PERM_SALES_VIEW', checked: false },
        { name: 'Sales.Create', labelKey: 'ROLES.PERM_SALES_CREATE', checked: false },
        { name: 'Sales.Return', labelKey: 'ROLES.PERM_SALES_RETURN', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_INVENTORY',
      icon: 'pi-box',
      permissions: [
        { name: 'Inventory.View', labelKey: 'ROLES.PERM_INVENTORY_VIEW', checked: false },
        { name: 'Inventory.Create', labelKey: 'ROLES.PERM_INVENTORY_CREATE', checked: false },
        { name: 'Inventory.Edit', labelKey: 'ROLES.PERM_INVENTORY_EDIT', checked: false },
        { name: 'Inventory.Transfer', labelKey: 'ROLES.PERM_INVENTORY_TRANSFER', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_PURCHASES',
      icon: 'pi-percentage',
      permissions: [
        { name: 'Purchases.View', labelKey: 'ROLES.PERM_PURCHASES_VIEW', checked: false },
        { name: 'Purchases.Create', labelKey: 'ROLES.PERM_PURCHASES_CREATE', checked: false },
        { name: 'Purchases.Edit', labelKey: 'ROLES.PERM_PURCHASES_EDIT', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_CUSTOMERS',
      icon: 'pi-users',
      permissions: [
        { name: 'Customers.View', labelKey: 'ROLES.PERM_CUSTOMERS_VIEW', checked: false },
        { name: 'Customers.Create', labelKey: 'ROLES.PERM_CUSTOMERS_CREATE', checked: false },
        { name: 'Customers.Edit', labelKey: 'ROLES.PERM_CUSTOMERS_EDIT', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_REPORTS',
      icon: 'pi-chart-bar',
      permissions: [
        { name: 'Reports.View', labelKey: 'ROLES.PERM_REPORTS_VIEW', checked: false },
        { name: 'Reports.Export', labelKey: 'ROLES.PERM_REPORTS_EXPORT', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_ACCOUNTING',
      icon: 'pi-money-bill',
      permissions: [
        { name: 'Accounting.View', labelKey: 'ROLES.PERM_ACCOUNTING_VIEW', checked: false },
        { name: 'Accounting.Edit', labelKey: 'ROLES.PERM_ACCOUNTING_EDIT', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_USERS',
      icon: 'pi-user-plus',
      permissions: [
        { name: 'Users.Manage', labelKey: 'ROLES.PERM_USERS_MANAGE', checked: false }
      ]
    },
    {
      moduleKey: 'ROLES.MOD_SETTINGS',
      icon: 'pi-cog',
      permissions: [
        { name: 'Settings.Manage', labelKey: 'ROLES.PERM_SETTINGS_MANAGE', checked: false }
      ]
    }
  ]);

  ngOnInit() {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    this.loadRoleData();
  }

  loadRoleData() {
    if (!this.isEditMode || !this.roleId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<any[]>('/api/auth/roles').subscribe({
      next: (roles) => {
        const role = roles.find(r => r.id === this.roleId);
        if (role) {
          this.formName.set(role.name);
          
          // Apply checked state based on permissions array from server
          const currentPerms = role.permissions || [];
          this.matrix.update(m => {
            return m.map(mod => ({
              ...mod,
              permissions: mod.permissions.map(p => ({
                ...p,
                checked: currentPerms.includes(p.name)
              }))
            }));
          });
        } else {
          this.errorMessage.set(this.translate.instant('ROLES.ROLE_NOT_FOUND'));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('ROLES.LOAD_ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  togglePermission(moduleIndex: number, permIndex: number) {
    this.matrix.update(m => {
      const copy = [...m];
      const mod = { ...copy[moduleIndex] };
      const perms = [...mod.permissions];
      perms[permIndex] = {
        ...perms[permIndex],
        checked: !perms[permIndex].checked
      };
      mod.permissions = perms;
      copy[moduleIndex] = mod;
      return copy;
    });
  }

  toggleModuleAll(moduleIndex: number, checked: boolean) {
    this.matrix.update(m => {
      const copy = [...m];
      const mod = { ...copy[moduleIndex] };
      mod.permissions = mod.permissions.map(p => ({ ...p, checked }));
      copy[moduleIndex] = mod;
      return copy;
    });
  }

  isModuleAllChecked(mod: ModulePermissions): boolean {
    return mod.permissions.every(p => p.checked);
  }

  saveRole() {
    const name = this.formName().trim();
    if (!name) {
      this.errorMessage.set(this.translate.instant('ROLES.NAME_REQUIRED'));
      return;
    }

    // Extract selected permissions
    const selectedPerms: string[] = [];
    this.matrix().forEach(mod => {
      mod.permissions.forEach(p => {
        if (p.checked) selectedPerms.push(p.name);
      });
    });

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = { name, permissions: selectedPerms };

    if (this.isEditMode && this.roleId) {
      this.http.put(`/api/auth/roles/${this.roleId}`, payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('ROLES.UPDATE_SUCCESS'));
          setTimeout(() => this.router.navigate(['/users/roles']), 1500);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('ROLES.UPDATE_ERROR'));
          this.isLoading.set(false);
        }
      });
    } else {
      this.http.post('/api/auth/roles', payload).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('ROLES.CREATE_SUCCESS'));
          setTimeout(() => this.router.navigate(['/users/roles']), 1500);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('ROLES.CREATE_ERROR'));
          this.isLoading.set(false);
        }
      });
    }
  }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
