import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent, PhoneInputComponent, DEFAULT_PHONE_COUNTRY_CODE, splitPhoneNumber, combinePhoneNumber } from '@frontend/ui';

@Component({
  selector: 'lib-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLoaderComponent, PhoneInputComponent, TranslatePipe],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected languageService = inject(LanguageService);
  private translate = inject(TranslateService);

  translateRole(roleName: string): string {
    if (!roleName) return '';
    const key = `ROLE_NAMES.${roleName}`;
    const translated = this.translate.instant(key);
    return translated === key ? roleName : translated;
  }

  // Router parameters
  userId: string | null = null;
  isEditMode = false;

  // States
  roles = signal<any[]>([]);
  branches = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form Signals
  formName = signal<string>('');
  formEmail = signal<string>('');
  formPassword = signal<string>('');
  formRoleId = signal<string>('');
  formHomeBranchId = signal<string>('');
  formAvatarUrl = signal<string | null>(null);
  formPhoneCode = signal<string>(DEFAULT_PHONE_COUNTRY_CODE);
  formPhone = signal<string>('');
  formAddress = signal<string>('');

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.userId;
    this.loadDropdownData();
  }

  loadDropdownData() {
    this.isLoading.set(true);
    
    // Load roles
    this.http.get<any[]>('/api/auth/roles').subscribe({
      next: (res) => {
        this.roles.set(res);
        if (!this.isEditMode && res.length > 0) {
          this.formRoleId.set(res[0].id);
        }
        this.checkAndLoadUser();
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.isLoading.set(false);
      }
    });

    // Load branches
    this.http.get<any[]>('/api/auth/branches').subscribe({
      next: (res) => {
        this.branches.set(res);
        if (!this.isEditMode && res.length > 0) {
          this.formHomeBranchId.set(res[0].id);
        }
      },
      error: (err) => console.error('Failed to load branches', err)
    });
  }

  checkAndLoadUser() {
    if (!this.isEditMode || !this.userId) {
      this.isLoading.set(false);
      return;
    }

    // Fetch user list to find specific user details since no direct GET /user/:id exists
    this.http.get<any[]>('/api/auth/users').subscribe({
      next: (users) => {
        const user = users.find(u => u.id === this.userId);
        if (user) {
          this.formName.set(user.name);
          this.formEmail.set(user.email);
          this.formRoleId.set(user.role_id);
          this.formHomeBranchId.set(user.home_branch_id || '');
          this.formAvatarUrl.set(user.avatar_url || null);
          this.formAddress.set(user.address || '');
          const { code, number } = splitPhoneNumber(user.phone);
          this.formPhoneCode.set(code);
          this.formPhone.set(number);
        } else {
          this.errorMessage.set('Employee record not found.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load employee details.');
        this.isLoading.set(false);
      }
    });
  }

  saveUser() {
    const name = this.formName().trim();
    const email = this.formEmail().trim();
    const roleId = this.formRoleId();
    const homeBranchId = this.formHomeBranchId();
    const avatarUrl = this.formAvatarUrl();
    const phone = combinePhoneNumber(this.formPhoneCode(), this.formPhone());
    const address = this.formAddress().trim();
    const password = this.formPassword();

    if (!name || !email || !roleId) {
      this.errorMessage.set(this.translate.instant('USERS.FILL_REQUIRED_FIELDS'));
      return;
    }

    // Password Validation
    if (!this.isEditMode) {
      if (!password || password.length < 6) {
        this.errorMessage.set(this.translate.instant('USERS.ERROR_PASSWORD_SHORT'));
        return;
      }
    } else {
      if (password && password.length < 6) {
        this.errorMessage.set(this.translate.instant('USERS.ERROR_PASSWORD_SHORT'));
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.isEditMode && this.userId) {
      const payload: any = { name, email, roleId, homeBranchId, avatarUrl, phone, address };
      if (password) {
        payload.password = password;
      }

      this.http.put(`/api/auth/users/${this.userId}`, payload).subscribe({
        next: () => {
          this.showSuccess('Employee account updated successfully.');
          setTimeout(() => this.router.navigate(['/users']), 1500);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to update employee.');
          this.isLoading.set(false);
        }
      });
    } else {
      const finalPassword = password || 'password123';
      const payload = { name, email, password: finalPassword, roleId, homeBranchId, avatarUrl, phone, address };

      this.http.post('/api/auth/users', payload).subscribe({
        next: () => {
          this.showSuccess('Employee account created successfully.');
          setTimeout(() => this.router.navigate(['/users']), 1500);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to create employee.');
          this.isLoading.set(false);
        }
      });
    }
  }

  onAvatarFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.formAvatarUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar() {
    this.formAvatarUrl.set(null);
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

  onCancel() {
    this.router.navigate(['/users']);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
