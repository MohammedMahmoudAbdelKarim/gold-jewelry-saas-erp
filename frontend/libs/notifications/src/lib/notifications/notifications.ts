import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent } from '@frontend/ui';
import { NotificationsApiService } from '../api/notifications-api.service';
import { AppNotification } from '../models/notifications.models';

@Component({
  selector: 'lib-notifications',
  standalone: true,
  imports: [CommonModule, TranslatePipe, PageLoaderComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications implements OnInit {
  private notificationsApi = inject(NotificationsApiService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  notifications = signal<AppNotification[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  unreadCount = computed(() => this.notifications().filter((n) => !n.is_read).length);

  typeIcon: Record<string, string> = {
    info: 'pi-info-circle',
    success: 'pi-check-circle',
    warning: 'pi-exclamation-triangle',
    danger: 'pi-times-circle',
  };

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.notificationsApi.getAll().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('NOTIFICATIONS.ERROR_LOAD'));
        this.isLoading.set(false);
      },
    });
  }

  markAsRead(notification: AppNotification) {
    if (notification.is_read) return;
    this.notificationsApi.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
        );
      },
      error: (err) => console.error('Failed to mark notification as read', err),
    });
  }

  markAllAsRead() {
    if (this.unreadCount() === 0) return;
    this.notificationsApi.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((items) => items.map((n) => ({ ...n, is_read: true })));
      },
      error: (err) => console.error('Failed to mark all notifications as read', err),
    });
  }

  deleteNotification(id: string) {
    this.notificationsApi.delete(id).subscribe({
      next: () => {
        this.notifications.update((items) => items.filter((n) => n.id !== id));
      },
      error: (err) => console.error('Failed to delete notification', err),
    });
  }
}
