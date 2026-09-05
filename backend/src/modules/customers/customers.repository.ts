import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
  id_type?: string;
  id_number?: string;
  gold_balance_grams: string | number;
  cash_balance: string | number;
  created_at?: string;
}

export interface CreateCustomerInput {
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  goldBalanceGrams?: number;
  cashBalance?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  goldBalanceGrams?: number;
  cashBalance?: number;
}

@Injectable()
export class CustomersRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(tenantId: string): Promise<Customer[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockCustomers.filter((c) => c.tenant_id === tenantId);
    }
    const result = await this.dbService.query(
      `SELECT * FROM customers WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows as Customer[];
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    if (this.dbService.isMockMode) {
      return (
        this.dbService.mockCustomers.find((c) => c.id === id && c.tenant_id === tenantId) || null
      );
    }
    const result = await this.dbService.query(
      `SELECT * FROM customers WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result.rows.length > 0 ? (result.rows[0] as Customer) : null;
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    if (this.dbService.isMockMode) {
      const customer: Customer = {
        id: 'mock-customer-' + Math.random().toString(36).substr(2, 9),
        tenant_id: data.tenantId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        id_type: data.idType,
        id_number: data.idNumber,
        gold_balance_grams: data.goldBalanceGrams || 0,
        cash_balance: data.cashBalance || 0,
        created_at: new Date().toISOString(),
      };
      this.dbService.mockCustomers.push(customer);
      return customer;
    }

    const query = `
      INSERT INTO customers (tenant_id, name, phone, email, id_type, id_number, gold_balance_grams, cash_balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      data.tenantId,
      data.name,
      data.phone || null,
      data.email || null,
      data.idType || null,
      data.idNumber || null,
      data.goldBalanceGrams || 0,
      data.cashBalance || 0,
    ];
    const result = await this.dbService.query(query, params);
    return result.rows[0] as Customer;
  }

  async update(id: string, tenantId: string, data: UpdateCustomerInput): Promise<Customer | null> {
    if (this.dbService.isMockMode) {
      const customer = this.dbService.mockCustomers.find(
        (c) => c.id === id && c.tenant_id === tenantId,
      );
      if (!customer) return null;
      if (data.name !== undefined) customer.name = data.name;
      if (data.phone !== undefined) customer.phone = data.phone;
      if (data.email !== undefined) customer.email = data.email;
      if (data.idType !== undefined) customer.id_type = data.idType;
      if (data.idNumber !== undefined) customer.id_number = data.idNumber;
      if (data.goldBalanceGrams !== undefined) customer.gold_balance_grams = data.goldBalanceGrams;
      if (data.cashBalance !== undefined) customer.cash_balance = data.cashBalance;
      return customer;
    }

    const fieldMap: [keyof UpdateCustomerInput, string][] = [
      ['name', 'name'],
      ['phone', 'phone'],
      ['email', 'email'],
      ['idType', 'id_type'],
      ['idNumber', 'id_number'],
      ['goldBalanceGrams', 'gold_balance_grams'],
      ['cashBalance', 'cash_balance'],
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
      UPDATE customers
      SET ${sets.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.dbService.query(query, params);
    return result.rows.length > 0 ? (result.rows[0] as Customer) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (this.dbService.isMockMode) {
      const index = this.dbService.mockCustomers.findIndex(
        (c) => c.id === id && c.tenant_id === tenantId,
      );
      if (index > -1) {
        this.dbService.mockCustomers.splice(index, 1);
        return true;
      }
      return false;
    }
    const result = await this.dbService.query(
      `DELETE FROM customers WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result.rowCount > 0;
  }
}
