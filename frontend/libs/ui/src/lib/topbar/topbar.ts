import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService, ThemeService, SystemSettingsService } from '@frontend/core';
import { AuthService } from '@frontend/auth';

import { LayoutService } from '../services/layout.service';

interface ToolbarNotification {
  id: number;
  icon: string;
  titleKey: string;
  messageKey: string;
  timeKey: string;
  unread: boolean;
}

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar implements OnInit {
  public languageService = inject(LanguageService);
  public layoutService = inject(LayoutService);
  public themeService = inject(ThemeService);
  public systemSettingsService = inject(SystemSettingsService);
  private destroyRef = inject(DestroyRef);
  protected authService = inject(AuthService);
  private router = inject(Router);

  notificationOpen = signal(false);
  profileOpen = signal(false);
  searchOpen = signal(false);
  marketOpen = signal(false);
  branchOpen = signal(false);
  logoutConfirmOpen = signal(false);
  selectedBranch = signal('Cairo HQ');
  currentDate = signal('');
  currentTime = signal('');

  readonly branches = ['Cairo HQ', 'Giza Mall Store', 'Alexandria Gold Souk'];

  readonly notifications: ToolbarNotification[] = [
    {
      id: 1,
      icon: 'pi-shopping-cart',
      titleKey: 'TOOLBAR.NOTIF_SALE_TITLE',
      messageKey: 'TOOLBAR.NOTIF_SALE_MSG',
      timeKey: 'TOOLBAR.NOTIF_TIME_5M',
      unread: true,
    },
    {
      id: 2,
      icon: 'pi-box',
      titleKey: 'TOOLBAR.NOTIF_STOCK_TITLE',
      messageKey: 'TOOLBAR.NOTIF_STOCK_MSG',
      timeKey: 'TOOLBAR.NOTIF_TIME_1H',
      unread: true,
    },
    {
      id: 3,
      icon: 'pi-chart-line',
      titleKey: 'TOOLBAR.NOTIF_PRICE_TITLE',
      messageKey: 'TOOLBAR.NOTIF_PRICE_MSG',
      timeKey: 'TOOLBAR.NOTIF_TIME_3H',
      unread: false,
    },
  ];

  goldPrices = computed(() => {
    const cfg = this.systemSettingsService.config();
    return [
      { karat: '24K', price: cfg.karat24, currency: 'EGP', trend: 'up' },
      { karat: '21K', price: cfg.karat21, currency: 'EGP', trend: 'up' },
      { karat: '18K', price: cfg.karat18, currency: 'EGP', trend: 'down' },
    ];
  });

  silverPrice = computed(() => {
    const cfg = this.systemSettingsService.config();
    return { price: cfg.silver, currency: 'EGP', trend: 'up' };
  });

  usdEgp = computed(() => {
    const cfg = this.systemSettingsService.config();
    return { rate: cfg.dollarPrice, trend: 'up', change: '+0.15' };
  });

  ngOnInit() {
    this.updateDateTime();
    const timer = setInterval(() => this.updateDateTime(), 1000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.notificationOpen.set(false);
    this.profileOpen.set(false);
    this.marketOpen.set(false);
    this.branchOpen.set(false);
  }

  toggleLang() {
    this.languageService.toggleLanguage();
    this.updateDateTime();
  }

  toggleMenu() {
    this.layoutService.toggleSidebar();
  }

  toggleBranch(event: Event) {
    event.stopPropagation();
    this.branchOpen.update((open) => !open);
    this.notificationOpen.set(false);
    this.profileOpen.set(false);
    this.marketOpen.set(false);
  }

  selectBranch(branch: string) {
    this.selectedBranch.set(branch);
    this.branchOpen.set(false);
  }

  toggleMarket(event: Event) {
    event.stopPropagation();
    this.marketOpen.update((open) => !open);
    this.notificationOpen.set(false);
    this.profileOpen.set(false);
    this.branchOpen.set(false);
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.notificationOpen.update((open) => !open);
    this.profileOpen.set(false);
    this.marketOpen.set(false);
    this.branchOpen.set(false);
  }

  viewAllNotifications() {
    this.notificationOpen.set(false);
    this.router.navigate(['/notifications']);
  }

  toggleProfile(event: Event) {
    event.stopPropagation();
    this.profileOpen.update((open) => !open);
    this.notificationOpen.set(false);
    this.marketOpen.set(false);
    this.branchOpen.set(false);
  }

  unreadCount(): number {
    return this.notifications.filter((n) => n.unread).length;
  }

  navigateToProfile() {
    this.profileOpen.set(false);
    this.router.navigate(['/profile']);
  }

  confirmLogout(event: Event) {
    event.stopPropagation();
    this.profileOpen.set(false);
    this.logoutConfirmOpen.set(true);
  }

  cancelLogout() {
    this.logoutConfirmOpen.set(false);
  }

  executeLogout() {
    this.logoutConfirmOpen.set(false);
    this.authService.logout();
  }

  private updateDateTime() {
    const locale = this.languageService.currentLanguage() === 'ar' ? 'ar-EG' : 'en-GB';
    const now = new Date();

    this.currentDate.set(
      now.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );

    this.currentTime.set(
      now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }
}
