import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  branch_id: string;
  supplier_id: string;
  supplier_name?: string;
  user_id: string;
  po_number: string;
  item_description: string;
  gold_karat?: string;
  weight_grams: string | number;
  unit_cost_per_gram: string | number;
  total_cost: string | number;
  status: string;
  notes?: string;
  created_at?: string;
}

export interface CreatePurchaseOrderInput {
  tenantId: string;
  branchId: string;
  supplierId: string;
  userId: string;
  itemDescription: string;
  goldKarat?: string;
  weightGrams: number;
  unitCostPerGram: number;
  notes?: string;
}

export interface UpdatePurchaseOrderInput {
  itemDescription?: string;
  goldKarat?: string;
  weightGrams?: number;
  unitCostPerGram?: number;
  status?: string;
  notes?: string;
}

@Injectable()
export class PurchaseRepository {
  constructor(private readonly dbService: DatabaseService) {}

  private withSupplierName(order: any): PurchaseOrder {
    const supplier = this.dbService.mockSuppliers.find((s) => s.id === order.supplier_id);
    return { ...order, supplier_name: supplier?.company_name };
  }

  async findAll(tenantId: string): Promise<PurchaseOrder[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockPurchaseOrders
        .filter((o) => o.tenant_id === tenantId)
        .map((o) => this.withSupplierName(o));
    }
    const result = await this.dbService.query(
      `SELECT po.*, s.company_name as supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.tenant_id = $1
       ORDER BY po.created_at DESC`,
      [tenantId],
    );
    return result.rows as PurchaseOrder[];
  }

  async findById(id: string, tenantId: string): Promise<PurchaseOrder | null> {
    if (this.dbService.isMockMode) {
      const order = this.dbService.mockPurchaseOrders.find(
        (o) => o.id === id && o.tenant_id === tenantId,
      );
      return order ? this.withSupplierName(order) : null;
    }
    const result = await this.dbService.query(
      `SELECT po.*, s.company_name as supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = $1 AND po.tenant_id = $2`,
      [id, tenantId],
    );
    return result.rows.length > 0 ? (result.rows[0] as PurchaseOrder) : null;
  }

  async create(data: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const totalCost = data.weightGrams * data.unitCostPerGram;
    const poNumber = 'PO-' + Date.now().toString(36).toUpperCase();

    if (this.dbService.isMockMode) {
      const order = {
        id: 'mock-po-' + Math.random().toString(36).substr(2, 9),
        tenant_id: data.tenantId,
        branch_id: data.branchId,
        supplier_id: data.supplierId,
        user_id: data.userId,
        po_number: poNumber,
        item_description: data.itemDescription,
        gold_karat: data.goldKarat,
        weight_grams: data.weightGrams,
        unit_cost_per_gram: data.unitCostPerGram,
        total_cost: totalCost,
        status: 'pending',
        notes: data.notes,
        created_at: new Date().toISOString(),
      };
      this.dbService.mockPurchaseOrders.push(order);
      return this.withSupplierName(order);
    }

    const query = `
      INSERT INTO purchase_orders (
        tenant_id, branch_id, supplier_id, user_id, po_number, item_description,
        gold_karat, weight_grams, unit_cost_per_gram, total_cost, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
      RETURNING *
    `;
    const params = [
      data.tenantId,
      data.branchId,
      data.supplierId,
      data.userId,
      poNumber,
      data.itemDescription,
      data.goldKarat || null,
      data.weightGrams,
      data.unitCostPerGram,
      totalCost,
      data.notes || null,
    ];
    const result = await this.dbService.query(query, params);
    return result.rows[0] as PurchaseOrder;
  }

  async update(id: string, tenantId: string, data: UpdatePurchaseOrderInput): Promise<PurchaseOrder | null> {
    if (this.dbService.isMockMode) {
      const order = this.dbService.mockPurchaseOrders.find(
        (o) => o.id === id && o.tenant_id === tenantId,
      );
      if (!order) return null;
      if (data.itemDescription !== undefined) order.item_description = data.itemDescription;
      if (data.goldKarat !== undefined) order.gold_karat = data.goldKarat;
      if (data.weightGrams !== undefined) order.weight_grams = data.weightGrams;
      if (data.unitCostPerGram !== undefined) order.unit_cost_per_gram = data.unitCostPerGram;
      if (data.status !== undefined) order.status = data.status;
      if (data.notes !== undefined) order.notes = data.notes;
      if (data.weightGrams !== undefined || data.unitCostPerGram !== undefined) {
        order.total_cost = Number(order.weight_grams) * Number(order.unit_cost_per_gram);
      }
      return this.withSupplierName(order);
    }

    const fieldMap: [keyof UpdatePurchaseOrderInput, string][] = [
      ['itemDescription', 'item_description'],
      ['goldKarat', 'gold_karat'],
      ['weightGrams', 'weight_grams'],
      ['unitCostPerGram', 'unit_cost_per_gram'],
      ['status', 'status'],
      ['notes', 'notes'],
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
    if (data.weightGrams !== undefined || data.unitCostPerGram !== undefined) {
      sets.push(`total_cost = weight_grams * unit_cost_per_gram`);
    }
    if (sets.length === 0) return this.findById(id, tenantId);

    const query = `
      UPDATE purchase_orders
      SET ${sets.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.dbService.query(query, params);
    return result.rows.length > 0 ? (result.rows[0] as PurchaseOrder) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (this.dbService.isMockMode) {
      const index = this.dbService.mockPurchaseOrders.findIndex(
        (o) => o.id === id && o.tenant_id === tenantId,
      );
      if (index > -1) {
        this.dbService.mockPurchaseOrders.splice(index, 1);
        return true;
      }
      return false;
    }
    const result = await this.dbService.query(
      `DELETE FROM purchase_orders WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result.rowCount > 0;
  }
}
