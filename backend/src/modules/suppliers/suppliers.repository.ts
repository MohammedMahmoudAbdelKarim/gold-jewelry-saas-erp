import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface Supplier {
  id: string;
  tenant_id: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  gold_receivable_grams: string | number;
  cash_payable: string | number;
  created_at?: string;
}

export interface CreateSupplierInput {
  tenantId: string;
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  goldReceivableGrams?: number;
  cashPayable?: number;
}

export interface UpdateSupplierInput {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  goldReceivableGrams?: number;
  cashPayable?: number;
}

@Injectable()
export class SuppliersRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(tenantId: string): Promise<Supplier[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockSuppliers.filter((s) => s.tenant_id === tenantId);
    }
    const result = await this.dbService.query(
      `SELECT * FROM suppliers WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows as Supplier[];
  }

  async findById(id: string, tenantId: string): Promise<Supplier | null> {
    if (this.dbService.isMockMode) {
      return (
        this.dbService.mockSuppliers.find((s) => s.id === id && s.tenant_id === tenantId) || null
      );
    }
    const result = await this.dbService.query(
      `SELECT * FROM suppliers WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result.rows.length > 0 ? (result.rows[0] as Supplier) : null;
  }

  async create(data: CreateSupplierInput): Promise<Supplier> {
    if (this.dbService.isMockMode) {
      const supplier: Supplier = {
        id: 'mock-supplier-' + Math.random().toString(36).substr(2, 9),
        tenant_id: data.tenantId,
        company_name: data.companyName,
        contact_name: data.contactName,
        phone: data.phone,
        email: data.email,
        gold_receivable_grams: data.goldReceivableGrams || 0,
        cash_payable: data.cashPayable || 0,
        created_at: new Date().toISOString(),
      };
      this.dbService.mockSuppliers.push(supplier);
      return supplier;
    }

    const query = `
      INSERT INTO suppliers (tenant_id, company_name, contact_name, phone, email, gold_receivable_grams, cash_payable)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      data.tenantId,
      data.companyName,
      data.contactName || null,
      data.phone || null,
      data.email || null,
      data.goldReceivableGrams || 0,
      data.cashPayable || 0,
    ];
    const result = await this.dbService.query(query, params);
    return result.rows[0] as Supplier;
  }

  async update(id: string, tenantId: string, data: UpdateSupplierInput): Promise<Supplier | null> {
    if (this.dbService.isMockMode) {
      const supplier = this.dbService.mockSuppliers.find(
        (s) => s.id === id && s.tenant_id === tenantId,
      );
      if (!supplier) return null;
      if (data.companyName !== undefined) supplier.company_name = data.companyName;
      if (data.contactName !== undefined) supplier.contact_name = data.contactName;
      if (data.phone !== undefined) supplier.phone = data.phone;
      if (data.email !== undefined) supplier.email = data.email;
      if (data.goldReceivableGrams !== undefined) supplier.gold_receivable_grams = data.goldReceivableGrams;
      if (data.cashPayable !== undefined) supplier.cash_payable = data.cashPayable;
      return supplier;
    }

    const fieldMap: [keyof UpdateSupplierInput, string][] = [
      ['companyName', 'company_name'],
      ['contactName', 'contact_name'],
      ['phone', 'phone'],
      ['email', 'email'],
      ['goldReceivableGrams', 'gold_receivable_grams'],
      ['cashPayable', 'cash_payable'],
    ];
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let count = 3;
    for (const [key, column] of fieldMap) {
      if (data[key] !== undefined) {
        sets.push(`${column} = $${count++}`);
        params.push(data[key]);
      }
    }
    if (sets.length === 0) return this.findById(id, tenantId);

    const query = `
      UPDATE suppliers
      SET ${sets.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.dbService.query(query, params);
    return result.rows.length > 0 ? (result.rows[0] as Supplier) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (this.dbService.isMockMode) {
      const index = this.dbService.mockSuppliers.findIndex(
        (s) => s.id === id && s.tenant_id === tenantId,
      );
      if (index > -1) {
        this.dbService.mockSuppliers.splice(index, 1);
        return true;
      }
      return false;
    }
    const result = await this.dbService.query(
      `DELETE FROM suppliers WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result.rowCount > 0;
  }
}
