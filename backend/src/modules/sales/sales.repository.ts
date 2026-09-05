import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { QueryExecutor } from '../inventory/inventory.repository';

export interface CreateTransactionInput {
  tenantId: string;
  branchId: string;
  customerId: string | null;
  userId: string;
  invoiceNumber: string;
  goldRateApplied24k: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface CreateSalesItemInput {
  salesTransactionId: string;
  inventoryItemId: string;
  goldRateApplied: number;
  metalValueCalculated: number;
  makingChargeApplied: number;
  stoneChargeApplied: number;
  finalItemPrice: number;
}

export interface CreateBuybackInput {
  tenantId: string;
  branchId: string;
  customerId?: string | null;
  associatedSaleId: string;
  claimedKarat: string;
  testedPurityPercent: number;
  grossWeight: number;
  netWeight: number;
  buybackRateApplied: number;
  totalValuation: number;
}

@Injectable()
export class SalesRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async createTransaction(
    data: CreateTransactionInput,
    client?: QueryExecutor,
  ): Promise<{ id: string }> {
    const query = `
      INSERT INTO sales_transactions (
        tenant_id, branch_id, customer_id, user_id, invoice_number, 
        gold_rate_applied_24k, subtotal, tax_amount, discount_amount, 
        total_amount, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'paid')
      RETURNING id
    `;
    const params = [
      data.tenantId,
      data.branchId,
      data.customerId,
      data.userId,
      data.invoiceNumber,
      data.goldRateApplied24k,
      data.subtotal,
      data.taxAmount,
      data.discountAmount,
      data.totalAmount,
    ];
    const executor: QueryExecutor = client || this.dbService;
    const result = await executor.query(query, params);
    return result.rows[0] as { id: string };
  }

  async createSalesItem(
    data: CreateSalesItemInput,
    client?: QueryExecutor,
  ): Promise<void> {
    const query = `
      INSERT INTO sales_items (
        sales_transaction_id, inventory_item_id, gold_rate_applied, 
        metal_value_calculated, making_charge_applied, stone_charge_applied, 
        final_item_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const params = [
      data.salesTransactionId,
      data.inventoryItemId,
      data.goldRateApplied,
      data.metalValueCalculated,
      data.makingChargeApplied,
      data.stoneChargeApplied,
      data.finalItemPrice,
    ];
    const executor: QueryExecutor = client || this.dbService;
    await executor.query(query, params);
  }

  async createBuyback(
    data: CreateBuybackInput,
    client?: QueryExecutor,
  ): Promise<void> {
    const query = `
      INSERT INTO gold_buybacks (
        tenant_id, branch_id, customer_id, associated_sale_id, 
        metal_type, claimed_karat, tested_purity_percent, 
        gross_weight, net_weight, buyback_rate_applied, total_valuation
      ) VALUES ($1, $2, $3, $4, 'gold', $5, $6, $7, $8, $9, $10)
    `;
    const params = [
      data.tenantId,
      data.branchId,
      data.customerId,
      data.associatedSaleId,
      data.claimedKarat,
      data.testedPurityPercent,
      data.grossWeight,
      data.netWeight,
      data.buybackRateApplied,
      data.totalValuation,
    ];
    const executor: QueryExecutor = client || this.dbService;
    await executor.query(query, params);
  }

  async findAllTransactions(tenantId: string): Promise<any[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockTransactions
        .filter((t) => t.tenant_id === tenantId)
        .map((t) => {
          const customer = this.dbService.mockCustomers.find((c) => c.id === t.customer_id);
          return { ...t, customer_name: customer?.name };
        });
    }
    const result = await this.dbService.query(
      `SELECT st.*, c.name as customer_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.tenant_id = $1
       ORDER BY st.created_at DESC`,
      [tenantId],
    );
    return result.rows;
  }

  async findAllBuybacks(tenantId: string): Promise<any[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockBuybacks.filter((b) => b.tenant_id === tenantId);
    }
    const result = await this.dbService.query(
      `SELECT * FROM gold_buybacks WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows;
  }
}
