export interface ReportsSummary {
  sales: {
    totalRevenue: number;
    transactionCount: number;
    avgTicket: number;
    totalTax: number;
    totalDiscount: number;
    totalBuybackOffset: number;
  };
  inventory: {
    totalItems: number;
    inStockCount: number;
    soldCount: number;
    totalNetGoldWeightGrams: number;
  };
  customers: {
    totalCustomers: number;
    totalGoldBalanceGrams: number;
    totalCashBalance: number;
  };
  suppliers: {
    totalSuppliers: number;
    totalGoldReceivableGrams: number;
    totalCashPayable: number;
  };
  purchases: {
    totalOrders: number;
    pendingOrders: number;
    receivedOrders: number;
    totalSpend: number;
  };
}

export interface RecentSale {
  id: string;
  invoice_number: string;
  customer_name?: string;
  total_amount: number;
}
