import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export interface RecordAuditInput {
  tenantId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async record(data: RecordAuditInput): Promise<void> {
    const entry: AuditLogEntry = {
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      tenant_id: data.tenantId,
      user_email: data.userEmail,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      details: data.details,
      created_at: new Date().toISOString(),
    };

    if (this.dbService.isMockMode) {
      this.dbService.mockAuditLog.unshift(entry);
      // Cap in-memory log so a long-running demo session doesn't grow unbounded.
      if (this.dbService.mockAuditLog.length > 500) {
        this.dbService.mockAuditLog.length = 500;
      }
      return;
    }

    await this.dbService.query(
      `INSERT INTO audit_log (tenant_id, user_email, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [data.tenantId, data.userEmail, data.action, data.entityType, data.entityId || null, data.details || null],
    );
  }

  async findAll(tenantId: string): Promise<AuditLogEntry[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockAuditLog.filter((a) => a.tenant_id === tenantId);
    }
    const result = await this.dbService.query(
      `SELECT * FROM audit_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [tenantId],
    );
    return result.rows as AuditLogEntry[];
  }
}
