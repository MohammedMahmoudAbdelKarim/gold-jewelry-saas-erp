export interface AccountingOverview {
  totalRevenue: number;
  totalExpenses: number;
  netPosition: number;
  customerBalances: number;
  supplierPayables: number;
}

export type LedgerEntryType = 'revenue' | 'expense';

export interface LedgerEntry {
  id: string;
  date: string;
  type: LedgerEntryType;
  description: string;
  reference: string;
  amount: number;
}
