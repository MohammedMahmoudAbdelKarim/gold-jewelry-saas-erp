import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface QueryExecutor {
  query(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: any[]; rowCount: number }>;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  branch_id: string;
  product_id: string;
  barcode: string;
  gross_weight: string | number;
  net_gold_weight: string | number;
  gold_karat: string;
  making_charge_rate: string | number;
  making_charge_type: string;
  stone_charge: string | number;
  wastage_percent: string | number;
  status: string;
  product_name?: string;
  product_sku?: string;
}

export interface CreateInventoryItemInput {
  tenantId: string;
  branchId: string;
  productId: string;
  barcode: string;
  grossWeight: number;
  netGoldWeight: number;
  goldKarat: string;
  makingChargeRate?: number;
  makingChargeType?: string;
  stoneCharge?: number;
  wastagePercent?: number;
}

@Injectable()
export class InventoryRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(
    data: CreateInventoryItemInput,
    client?: QueryExecutor,
  ): Promise<InventoryItem> {
    const query = `
      INSERT INTO inventory_items (
        tenant_id, branch_id, product_id, barcode, gross_weight, 
        net_gold_weight, gold_karat, making_charge_rate, 
        making_charge_type, stone_charge, wastage_percent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'in_stock')
      RETURNING *
    `;
    const params = [
      data.tenantId,
      data.branchId,
      data.productId,
      data.barcode,
      data.grossWeight,
      data.netGoldWeight,
      data.goldKarat,
      data.makingChargeRate || 0,
      data.makingChargeType || 'per_gram',
      data.stoneCharge || 0,
      data.wastagePercent || 0,
    ];

    const executor: QueryExecutor = client || this.dbService;
    const result = await executor.query(query, params);
    return result.rows[0] as InventoryItem;
  }

  async getItemsByBranch(
    tenantId: string,
    branchId: string,
  ): Promise<InventoryItem[]> {
    const query = `
      SELECT i.*, p.name as product_name, p.sku as product_sku
      FROM inventory_items i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.tenant_id = $1 AND i.branch_id = $2
    `;
    const result = await this.dbService.query(query, [tenantId, branchId]);
    return result.rows as InventoryItem[];
  }

  async findAllForTenant(tenantId: string): Promise<InventoryItem[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockInventory.filter((i) => i.tenant_id === tenantId);
    }
    const query = `
      SELECT i.*, p.name as product_name, p.sku as product_sku
      FROM inventory_items i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.tenant_id = $1
    `;
    const result = await this.dbService.query(query, [tenantId]);
    return result.rows as InventoryItem[];
  }

  async getItemByBarcode(
    tenantId: string,
    barcode: string,
  ): Promise<InventoryItem | null> {
    const query = `
      SELECT i.*, p.name as product_name, p.sku as product_sku
      FROM inventory_items i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.tenant_id = $1 AND i.barcode = $2 AND i.status = 'in_stock'
    `;
    const result = await this.dbService.query(query, [tenantId, barcode]);
    return result.rows.length > 0 ? (result.rows[0] as InventoryItem) : null;
  }

  async updateStatusToSold(
    id: string,
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<boolean> {
    const query = `
      UPDATE inventory_items 
      SET status = 'sold', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND tenant_id = $2 AND status = 'in_stock'
    `;
    const executor: QueryExecutor = client || this.dbService;
    const result = await executor.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      grossWeight?: number;
      netGoldWeight?: number;
      goldKarat?: string;
      makingChargeRate?: number;
      makingChargeType?: string;
      stoneCharge?: number;
      wastagePercent?: number;
      status?: string;
    },
    client?: QueryExecutor,
  ): Promise<boolean> {
    const query = `
      UPDATE inventory_items
      SET 
        gross_weight = COALESCE($3, gross_weight),
        net_gold_weight = COALESCE($4, net_gold_weight),
        gold_karat = COALESCE($5, gold_karat),
        making_charge_rate = COALESCE($6, making_charge_rate),
        making_charge_type = COALESCE($7, making_charge_type),
        stone_charge = COALESCE($8, stone_charge),
        wastage_percent = COALESCE($9, wastage_percent),
        status = COALESCE($10, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
    `;
    const params = [
      id,
      tenantId,
      data.grossWeight !== undefined ? data.grossWeight : null,
      data.netGoldWeight !== undefined ? data.netGoldWeight : null,
      data.goldKarat !== undefined ? data.goldKarat : null,
      data.makingChargeRate !== undefined ? data.makingChargeRate : null,
      data.makingChargeType !== undefined ? data.makingChargeType : null,
      data.stoneCharge !== undefined ? data.stoneCharge : null,
      data.wastagePercent !== undefined ? data.wastagePercent : null,
      data.status !== undefined ? data.status : null,
    ];
    const executor: QueryExecutor = client || this.dbService;
    const result = await executor.query(query, params);
    return result.rowCount > 0;
  }

  async delete(
    id: string,
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<boolean> {
    const query = `
      DELETE FROM inventory_items
      WHERE id = $1 AND tenant_id = $2
    `;
    const executor: QueryExecutor = client || this.dbService;
    const result = await executor.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}
