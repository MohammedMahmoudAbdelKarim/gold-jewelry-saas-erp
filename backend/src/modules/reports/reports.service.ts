import { Injectable } from '@nestjs/common';
import { SalesRepository } from '../sales/sales.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { SuppliersRepository } from '../suppliers/suppliers.repository';
import { PurchaseRepository } from '../purchase/purchase.repository';

const num = (v: unknown): number => (typeof v === 'string' ? parseFloat(v) : (v as number)) || 0;

@Injectable()
export class ReportsService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly suppliersRepository: SuppliersRepository,
    private readonly purchaseRepository: PurchaseRepository,
  ) {}

  async getSummary(tenantId: string) {
    const [transactions, buybacks, inventoryItems, customers, suppliers, purchaseOrders] =
      await Promise.all([
        this.salesRepository.findAllTransactions(tenantId),
        this.salesRepository.findAllBuybacks(tenantId),
        this.inventoryRepository.findAllForTenant(tenantId),
        this.customersRepository.findAll(tenantId),
        this.suppliersRepository.findAll(tenantId),
        this.purchaseRepository.findAll(tenantId),
      ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + num(t.total_amount), 0);
    const totalTax = transactions.reduce((sum, t) => sum + num(t.tax_amount), 0);
    const totalDiscount = transactions.reduce((sum, t) => sum + num(t.discount_amount), 0);
    const totalBuybackOffset = buybacks.reduce((sum, b) => sum + num(b.total_valuation), 0);

    const inStockItems = inventoryItems.filter((i) => i.status === 'in_stock');
    const soldItems = inventoryItems.filter((i) => i.status === 'sold');
    const totalNetGoldWeight = inStockItems.reduce((sum, i) => sum + num(i.net_gold_weight), 0);

    const totalPurchaseSpend = purchaseOrders.reduce((sum, o) => sum + num(o.total_cost), 0);
    const pendingOrders = purchaseOrders.filter((o) => o.status === 'pending').length;
    const receivedOrders = purchaseOrders.filter((o) => o.status === 'received').length;

    return {
      sales: {
        totalRevenue: round2(totalRevenue),
        transactionCount: transactions.length,
        avgTicket: transactions.length ? round2(totalRevenue / transactions.length) : 0,
        totalTax: round2(totalTax),
        totalDiscount: round2(totalDiscount),
        totalBuybackOffset: round2(totalBuybackOffset),
      },
      inventory: {
        totalItems: inventoryItems.length,
        inStockCount: inStockItems.length,
        soldCount: soldItems.length,
        totalNetGoldWeightGrams: round2(totalNetGoldWeight),
      },
      customers: {
        totalCustomers: customers.length,
        totalGoldBalanceGrams: round2(customers.reduce((s, c) => s + num(c.gold_balance_grams), 0)),
        totalCashBalance: round2(customers.reduce((s, c) => s + num(c.cash_balance), 0)),
      },
      suppliers: {
        totalSuppliers: suppliers.length,
        totalGoldReceivableGrams: round2(
          suppliers.reduce((s, sup) => s + num(sup.gold_receivable_grams), 0),
        ),
        totalCashPayable: round2(suppliers.reduce((s, sup) => s + num(sup.cash_payable), 0)),
      },
      purchases: {
        totalOrders: purchaseOrders.length,
        pendingOrders,
        receivedOrders,
        totalSpend: round2(totalPurchaseSpend),
      },
    };
  }

  async getRecentSales(tenantId: string, limit = 10) {
    const transactions = await this.salesRepository.findAllTransactions(tenantId);
    return transactions.slice(0, limit);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
