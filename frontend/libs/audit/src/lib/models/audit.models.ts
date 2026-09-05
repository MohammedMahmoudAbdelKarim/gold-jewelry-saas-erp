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
