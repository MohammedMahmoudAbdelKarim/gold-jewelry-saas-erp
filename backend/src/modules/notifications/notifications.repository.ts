import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'danger';

export interface AppNotification {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(tenantId: string): Promise<AppNotification[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockNotifications
        .filter((n) => n.tenant_id === tenantId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    const result = await this.dbService.query(
      `SELECT * FROM notifications WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows as AppNotification[];
  }

  async markAsRead(id: string, tenantId: string): Promise<AppNotification | null> {
    if (this.dbService.isMockMode) {
      const notification = this.dbService.mockNotifications.find(
        (n) => n.id === id && n.tenant_id === tenantId,
      );
      if (!notification) return null;
      notification.is_read = true;
      return notification;
    }
    const result = await this.dbService.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId],
    );
    return result.rows.length > 0 ? (result.rows[0] as AppNotification) : null;
  }

  async markAllAsRead(tenantId: string): Promise<void> {
    if (this.dbService.isMockMode) {
      this.dbService.mockNotifications
        .filter((n) => n.tenant_id === tenantId)
        .forEach((n) => (n.is_read = true));
      return;
    }
    await this.dbService.query(`UPDATE notifications SET is_read = true WHERE tenant_id = $1`, [
      tenantId,
    ]);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (this.dbService.isMockMode) {
      const index = this.dbService.mockNotifications.findIndex(
        (n) => n.id === id && n.tenant_id === tenantId,
      );
      if (index > -1) {
        this.dbService.mockNotifications.splice(index, 1);
        return true;
      }
      return false;
    }
    const result = await this.dbService.query(
      `DELETE FROM notifications WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result.rowCount > 0;
  }
}
