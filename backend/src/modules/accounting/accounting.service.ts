import { Injectable } from '@nestjs/common';
import { SalesRepository } from '../sales/sales.repository';
import { PurchaseRepository } from '../purchase/purchase.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { SuppliersRepository } from '../suppliers/suppliers.repository';

const num = (v: unknown): number => (typeof v === 'string' ? parseFloat(v) : (v as number)) || 0;

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  description: string;
  reference: string;
  amount: number;
}

@Injectable()
export class AccountingService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly purchaseRepository: PurchaseRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly suppliersRepository: SuppliersRepository,
  ) {}

  async getOverview(tenantId: string) {
    const [transactions, purchaseOrders, customers, suppliers] = await Promise.all([
      this.salesRepository.findAllTransactions(tenantId),
      this.purchaseRepository.findAll(tenantId),
      this.customersRepository.findAll(tenantId),
      this.suppliersRepository.findAll(tenantId),
    ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + num(t.total_amount), 0);
    const totalExpenses = purchaseOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + num(o.total_cost), 0);

    const customerBalances = customers.reduce((sum, c) => sum + num(c.cash_balance), 0);
    const supplierPayables = suppliers.reduce((sum, s) => sum + num(s.cash_payable), 0);

    return {
      totalRevenue: round2(totalRevenue),
      totalExpenses: round2(totalExpenses),
      netPosition: round2(totalRevenue - totalExpenses),
      customerBalances: round2(customerBalances),
      supplierPayables: round2(supplierPayables),
    };
  }

  async getLedger(tenantId: string): Promise<LedgerEntry[]> {
    const [transactions, purchaseOrders] = await Promise.all([
      this.salesRepository.findAllTransactions(tenantId),
      this.purchaseRepository.findAll(tenantId),
    ]);

    const revenueEntries: LedgerEntry[] = transactions.map((t) => ({
      id: 'sale-' + t.id,
      date: t.created_at || new Date().toISOString(),
      type: 'revenue',
      description: t.customer_name ? `Sale to ${t.customer_name}` : 'Sale (walk-in customer)',
      reference: t.invoice_number,
      amount: num(t.total_amount),
    }));

    const expenseEntries: LedgerEntry[] = purchaseOrders
      .filter((o) => o.status !== 'cancelled')
      .map((o) => ({
        id: 'po-' + o.id,
        date: o.created_at || new Date().toISOString(),
        type: 'expense',
        description: o.item_description,
        reference: o.po_number,
        amount: num(o.total_cost),
      }));

    return [...revenueEntries, ...expenseEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
