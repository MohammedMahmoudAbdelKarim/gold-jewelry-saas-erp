import { ChangeDetectionStrategy, Component, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterModule, Router } from '@angular/router';
import { ThemeService, MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS, AuthService } from '@frontend/core';
import { BrandLogo } from '../brand-logo/brand-logo';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, TranslatePipe, RouterModule, BrandLogo],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected themeService = inject(ThemeService);
  protected layoutService = inject(LayoutService);
  protected authService = inject(AuthService);
  private router = inject(Router);

  protected mainNavItems = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    const perms = user.permissions || [];
    return MAIN_NAV_ITEMS.filter(
      (item) => !item.requiredPermission || perms.includes(item.requiredPermission)
    );
  });

  protected bottomNavItems = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    const perms = user.permissions || [];
    return BOTTOM_NAV_ITEMS.filter(
      (item) => !item.requiredPermission || perms.includes(item.requiredPermission)
    );
  });

  dropdownOpen = signal(false);
  logoutConfirmOpen = signal(false);

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update((open) => !open);
  }

  @HostListener('document:click')
  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  navigateToProfile() {
    this.dropdownOpen.set(false);
    this.closeOnNavigate();
    this.router.navigate(['/profile']);
  }

  navigateToSettings() {
    this.dropdownOpen.set(false);
    this.closeOnNavigate();
    this.router.navigate(['/settings']);
  }

  confirmLogout(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.set(false);
    this.logoutConfirmOpen.set(true);
  }

  cancelLogout() {
    this.logoutConfirmOpen.set(false);
  }

  executeLogout() {
    this.logoutConfirmOpen.set(false);
    this.authService.logout();
  }

  closeOnNavigate() {
    this.layoutService.closeMobileSidebar();
  }
}

