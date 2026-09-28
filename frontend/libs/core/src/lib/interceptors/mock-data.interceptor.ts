import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';

interface MockDatabase {
  users: any[];
  roles: any[];
  branches: any[];
  inventory: any[];
  customers: any[];
  suppliers: any[];
  purchaseOrders: any[];
  transactions: any[];
  notifications: any[];
  auditLogs: any[];
}

const STORAGE_KEY = 'aurum_erp_mock_db_v1';

function getInitialMockDatabase(): MockDatabase {
  return {
    branches: [
      { id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', tenant_id: 'tenant-1', name: 'Main Store Dubai', branch_type: 'retail', location: 'Dubai Mall, Ground Floor, Gold Souk', is_active: true },
      { id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161d', tenant_id: 'tenant-1', name: 'Cairo HQ Branch', branch_type: 'retail', location: 'Cairo Festival City, Luxury Zone', is_active: true },
      { id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161e', tenant_id: 'tenant-1', name: 'Jebel Ali Central Vault', branch_type: 'warehouse', location: 'JAFZA Zone 4, High Security Vault', is_active: true },
    ],
    roles: [
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a31', name: 'Owner', permissions: ['Dashboard.View', 'Sales.View', 'Sales.Create', 'Sales.Return', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Transfer', 'Purchases.View', 'Purchases.Create', 'Purchases.Edit', 'Customers.View', 'Customers.Create', 'Customers.Edit', 'Reports.View', 'Reports.Export', 'Accounting.View', 'Accounting.Edit', 'Users.Manage', 'Settings.Manage'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a32', name: 'Branch Manager', permissions: ['Dashboard.View', 'Sales.View', 'Sales.Create', 'Sales.Return', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Transfer', 'Purchases.View', 'Purchases.Create', 'Purchases.Edit', 'Customers.View', 'Customers.Create', 'Customers.Edit', 'Reports.View', 'Accounting.View'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a33', name: 'Sales / Cashier', permissions: ['Dashboard.View', 'Sales.View', 'Sales.Create', 'Customers.View', 'Customers.Create'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a34', name: 'Inventory Officer', permissions: ['Dashboard.View', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Transfer', 'Purchases.View', 'Purchases.Create'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a35', name: 'Purchasing Officer', permissions: ['Dashboard.View', 'Inventory.View', 'Purchases.View', 'Purchases.Create', 'Purchases.Edit'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a36', name: 'Accountant', permissions: ['Dashboard.View', 'Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', 'Reports.View', 'Reports.Export', 'Accounting.View', 'Accounting.Edit'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a37', name: 'Auditor', permissions: ['Dashboard.View', 'Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', 'Reports.View', 'Accounting.View'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a38', name: 'Support / Admin', permissions: ['Dashboard.View', 'Users.Manage', 'Settings.Manage'] },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a39', name: 'Viewer', permissions: ['Dashboard.View', 'Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', 'Reports.View', 'Accounting.View'] },
    ],
    users: [
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c1', name: 'Owner User', email: 'owner@test.com', role_name: 'Owner', role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a31', home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', branch_name: 'Main Store Dubai', is_active: true, avatar_url: null, phone: '+971501112233' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c2', name: 'Manager User', email: 'manager@test.com', role_name: 'Branch Manager', role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a32', home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', branch_name: 'Main Store Dubai', is_active: true, avatar_url: null, phone: '+971502223344' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c3', name: 'Cashier User', email: 'cashier@test.com', role_name: 'Sales / Cashier', role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a33', home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', branch_name: 'Main Store Dubai', is_active: true, avatar_url: null, phone: '+971503334455' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c4', name: 'Inventory Officer', email: 'inventory@test.com', role_name: 'Inventory Officer', role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a34', home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', branch_name: 'Main Store Dubai', is_active: true, avatar_url: null, phone: '+971504445566' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c5', name: 'Purchasing Officer', email: 'purchasing@test.com', role_name: 'Purchasing Officer', role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a35', home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', branch_name: 'Main Store Dubai', is_active: true, avatar_url: null, phone: '+971505556677' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c6', name: 'Accountant User', email: 'accountant@test.com', role_name: 'Accountant', role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a36', home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', branch_name: 'Main Store Dubai', is_active: true, avatar_url: null, phone: '+971506667788' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c8', name: 'Admin User', email: 'admin@test.com', role_name: 'Support / Admin', role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a38', home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', branch_name: 'Main Store Dubai', is_active: true, avatar_url: null, phone: '+971507778899' },
    ],
    inventory: [
      { id: 'item-1', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', barcode: 'RNG-21K-00941', gross_weight: 8.5, net_gold_weight: 7.0, gold_karat: '21K', making_charge_rate: 12.0, making_charge_type: 'per_gram', stone_charge: 150.0, wastage_percent: 5.0, status: 'in_stock', product_name: 'Golden Band Ring', product_sku: 'RNG-21K' },
      { id: 'item-2', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', barcode: 'RNG-21K-00942', gross_weight: 12.0, net_gold_weight: 10.0, gold_karat: '21K', making_charge_rate: 10.0, making_charge_type: 'per_gram', stone_charge: 0.0, wastage_percent: 5.0, status: 'in_stock', product_name: 'Classic Gold Ring', product_sku: 'RNG-21K' },
      { id: 'item-3', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', barcode: 'NKL-22K-01050', gross_weight: 25.0, net_gold_weight: 22.5, gold_karat: '22K', making_charge_rate: 15.0, making_charge_type: 'per_gram', stone_charge: 0.0, wastage_percent: 3.0, status: 'in_stock', product_name: 'Rope Chain Necklace', product_sku: 'NKL-22K' },
      { id: 'item-4', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', barcode: 'BRC-18K-00733', gross_weight: 18.0, net_gold_weight: 14.5, gold_karat: '18K', making_charge_rate: 20.0, making_charge_type: 'per_gram', stone_charge: 450.0, wastage_percent: 4.0, status: 'in_stock', product_name: 'Diamond Accent Bracelet', product_sku: 'BRC-18K' },
      { id: 'item-5', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', barcode: 'EAR-24K-00215', gross_weight: 5.2, net_gold_weight: 5.0, gold_karat: '24K', making_charge_rate: 18.0, making_charge_type: 'per_gram', stone_charge: 0.0, wastage_percent: 2.0, status: 'in_stock', product_name: 'Pure Gold Drop Earrings', product_sku: 'EAR-24K' },
      { id: 'item-6', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', barcode: 'PND-21K-00860', gross_weight: 6.8, net_gold_weight: 5.5, gold_karat: '21K', making_charge_rate: 14.0, making_charge_type: 'per_gram', stone_charge: 200.0, wastage_percent: 3.5, status: 'in_stock', product_name: 'Ruby Heart Pendant', product_sku: 'PND-21K' },
    ],
    customers: [
      { id: 'cust-1', name: 'Ahmed Al Mansoori', phone: '+971501234567', email: 'ahmed.mansoori@example.com', id_type: 'National ID', id_number: '784-1985-1234567-1', gold_balance_grams: 12.5, cash_balance: 0, created_at: new Date().toISOString() },
      { id: 'cust-2', name: 'Layla Hussein', phone: '+971502345678', email: 'layla.hussein@example.com', id_type: 'Passport', id_number: 'P1234567', gold_balance_grams: 0, cash_balance: 850.0, created_at: new Date().toISOString() },
      { id: 'cust-3', name: 'Omar Khaled', phone: '+971503456789', email: 'omar.khaled@example.com', id_type: 'Driving License', id_number: 'DL-99213', gold_balance_grams: 3.2, cash_balance: 0, created_at: new Date().toISOString() },
    ],
    suppliers: [
      { id: 'supp-1', company_name: 'Cairo Gold Refinery Co.', contact_name: 'Hassan Fathy', phone: '+20 1012223344', email: 'sales@cairogoldrefinery.com', gold_receivable_grams: 0, cash_payable: 45000.0, created_at: new Date().toISOString() },
      { id: 'supp-2', company_name: 'Al Nasr Bullion Trading', contact_name: 'Mona Adel', phone: '+20 1123334455', email: 'mona@alnasrbullion.com', gold_receivable_grams: 120.5, cash_payable: 0, created_at: new Date().toISOString() },
      { id: 'supp-3', company_name: 'Deira Precious Metals LLC', contact_name: 'Rami Aoun', phone: '+971 501112233', email: 'rami@deiraprecious.com', gold_receivable_grams: 0, cash_payable: 8250.0, created_at: new Date().toISOString() },
    ],
    purchaseOrders: [
      { id: 'po-1', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', supplier_id: 'supp-1', supplier_name: 'Cairo Gold Refinery Co.', po_number: 'PO-2026-0001', item_description: '1kg 24K gold bullion bar', gold_karat: '24K', weight_grams: 1000, unit_cost_per_gram: 3800, total_cost: 3800000, status: 'received', notes: 'Delivered to Cairo HQ vault', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'po-2', branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', supplier_id: 'supp-2', supplier_name: 'Al Nasr Bullion Trading', po_number: 'PO-2026-0002', item_description: '21K scrap gold, assorted pieces', gold_karat: '21K', weight_grams: 500, unit_cost_per_gram: 3300, total_cost: 1650000, status: 'pending', notes: 'Assay test scheduled', created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    transactions: [
      { id: 'tx-1', invoice_number: 'INV-2026-0001', branch_name: 'Main Store Dubai', customer_name: 'Ahmed Al Mansoori', total_amount: 48500, total_gold_weight: 12.5, payment_method: 'Cash + Card', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), items_count: 2 },
      { id: 'tx-2', invoice_number: 'INV-2026-0002', branch_name: 'Main Store Dubai', customer_name: 'Layla Hussein', total_amount: 25012, total_gold_weight: 7.0, payment_method: 'Card', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), items_count: 1 },
    ],
    notifications: [
      { id: 'notif-1', title: 'Low Stock Alert', message: '21K Golden Band Ring (RNG-21K-00941) is running low on stock.', type: 'warning', is_read: false, created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { id: 'notif-2', title: 'New Sale Completed', message: 'A new sale transaction (INV-2026-0001) was completed at Main Store Dubai.', type: 'success', is_read: false, created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      { id: 'notif-3', title: 'Gold Price Updated', message: '24K gold rate updated to 3,850 EGP/g.', type: 'info', is_read: true, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      { id: 'notif-4', title: 'Purchase Order Received', message: 'PO-2026-0001 from Cairo Gold Refinery Co. was marked as received.', type: 'success', is_read: true, created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
    ],
    auditLogs: [
      { id: 'audit-1', user_email: 'owner@test.com', action: 'login', entity_type: 'auth', details: 'Owner User signed into Aurum ERP', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'audit-2', user_email: 'owner@test.com', action: 'create', entity_type: 'customer', entity_id: 'cust-1', details: 'Created customer profile "Ahmed Al Mansoori"', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { id: 'audit-3', user_email: 'cashier@test.com', action: 'create', entity_type: 'sale', entity_id: 'tx-1', details: 'Completed sale invoice INV-2026-0001 for EGP 48,500', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    ],
  };
}

function loadDb(): MockDatabase {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return { ...getInitialMockDatabase(), ...JSON.parse(saved) };
    } catch {
      return getInitialMockDatabase();
    }
  }
  const initial = getInitialMockDatabase();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveDb(db: MockDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const mockDataInterceptor: HttpInterceptorFn = (req, next) => {
  // Let i18n JSON files or external URLs pass through
  if (req.url.endsWith('.json') || req.url.startsWith('http://') && !req.url.includes('/api') || req.url.startsWith('https://') && !req.url.includes('/api')) {
    return next(req);
  }

  const url = req.url.replace(/^\/?(api\/v1|api)/, '');
  const method = req.method;
  const db = loadDb();
  const reqBody = (req.body || {}) as Record<string, any>;

  // Helper response wrapper
  const send = (data: any, status = 200) => of(new HttpResponse({ status, body: data })).pipe(delay(50));

  // 1. Auth Login
  if (url === '/auth/login' && method === 'POST') {
    const email = (reqBody['email'] || '').toLowerCase();
    const user = db.users.find((u) => u.email?.toLowerCase() === email) || db.users[0];
    const role = db.roles.find((r) => r.id === user.role_id) || db.roles[0];
    
    return send({
      accessToken: 'mock-jwt-token-aurum-erp-xyz-' + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_name: user.role_name,
        role_id: user.role_id,
        home_branch_id: user.home_branch_id,
        branch_name: user.branch_name,
        permissions: role.permissions || [],
      },
    });
  }

  // 2. Auth Profile / Me
  if (url === '/auth/me' && method === 'GET') {
    return send(db.users[0]);
  }

  // 3. Auth Permissions
  if (url === '/auth/permissions' && method === 'GET') {
    return send({ permissions: db.roles[0].permissions });
  }

  // 4. Inventory Items Barcode lookup
  if (url.startsWith('/inventory/items/barcode/') && method === 'GET') {
    const barcode = url.split('/').pop();
    const item = db.inventory.find((i) => i.barcode === barcode);
    return send(item || null);
  }

  // 5. Inventory Items (List, Create, Update, Delete)
  if (url.startsWith('/inventory/items') || url === '/inventory') {
    if (method === 'GET') {
      return send(db.inventory);
    }
    if (method === 'POST') {
      const newItem = {
        id: 'item-' + Date.now(),
        status: 'in_stock',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        ...reqBody,
      };
      db.inventory.unshift(newItem);
      saveDb(db);
      return send(newItem, 201);
    }
    if (method === 'PUT') {
      const id = url.split('/').pop();
      const idx = db.inventory.findIndex((i) => i.id === id);
      if (idx !== -1) {
        db.inventory[idx] = { ...db.inventory[idx], ...reqBody };
        saveDb(db);
        return send(db.inventory[idx]);
      }
      return send({ message: 'Item updated' });
    }
    if (method === 'DELETE') {
      const id = url.split('/').pop();
      db.inventory = db.inventory.filter((i) => i.id !== id);
      saveDb(db);
      return send({ success: true });
    }
  }

  // 6. Sales / POS Transactions
  if (url.startsWith('/sales') || url.startsWith('/sales/transactions')) {
    if (method === 'GET') {
      return send(db.transactions);
    }
    if (method === 'POST') {
      const newTx = {
        id: 'tx-' + Date.now(),
        invoice_number: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
        branch_name: 'Main Store Dubai',
        customer_name: reqBody['customer_name'] || 'Walk-in Customer',
        total_amount: reqBody['total_amount'] || 0,
        total_gold_weight: reqBody['total_gold_weight'] || 0,
        payment_method: reqBody['payment_method'] || 'Cash',
        created_at: new Date().toISOString(),
        items_count: reqBody['items']?.length || 1,
      };
      db.transactions.unshift(newTx);
      // Mark cart items as sold
      if (Array.isArray(reqBody['items'])) {
        for (const it of reqBody['items']) {
          const invItem = db.inventory.find((i) => i.barcode === it.barcode || i.id === it.id);
          if (invItem) invItem.status = 'sold';
        }
      }
      saveDb(db);
      return send(newTx, 201);
    }
  }

  // 7. Customers
  if (url.startsWith('/customers')) {
    if (method === 'GET') {
      return send(db.customers);
    }
    if (method === 'POST') {
      const newCust = {
        id: 'cust-' + Date.now(),
        gold_balance_grams: 0,
        cash_balance: 0,
        created_at: new Date().toISOString(),
        ...reqBody,
      };
      db.customers.unshift(newCust);
      saveDb(db);
      return send(newCust, 201);
    }
    if (method === 'PUT') {
      const id = url.split('/').pop();
      const idx = db.customers.findIndex((c) => c.id === id);
      if (idx !== -1) {
        db.customers[idx] = { ...db.customers[idx], ...reqBody };
        saveDb(db);
        return send(db.customers[idx]);
      }
      return send({ message: 'Customer updated' });
    }
    if (method === 'DELETE') {
      const id = url.split('/').pop();
      db.customers = db.customers.filter((c) => c.id !== id);
      saveDb(db);
      return send({ success: true });
    }
  }

  // 8. Suppliers
  if (url.startsWith('/suppliers')) {
    if (method === 'GET') {
      return send(db.suppliers);
    }
    if (method === 'POST') {
      const newSupp = {
        id: 'supp-' + Date.now(),
        gold_receivable_grams: 0,
        cash_payable: 0,
        created_at: new Date().toISOString(),
        ...reqBody,
      };
      db.suppliers.unshift(newSupp);
      saveDb(db);
      return send(newSupp, 201);
    }
    if (method === 'PUT') {
      const id = url.split('/').pop();
      const idx = db.suppliers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        db.suppliers[idx] = { ...db.suppliers[idx], ...reqBody };
        saveDb(db);
        return send(db.suppliers[idx]);
      }
      return send({ message: 'Supplier updated' });
    }
    if (method === 'DELETE') {
      const id = url.split('/').pop();
      db.suppliers = db.suppliers.filter((s) => s.id !== id);
      saveDb(db);
      return send({ success: true });
    }
  }

  // 9. Purchases
  if (url.startsWith('/purchase')) {
    if (method === 'GET') {
      return send(db.purchaseOrders);
    }
    if (method === 'POST') {
      const newPo = {
        id: 'po-' + Date.now(),
        po_number: 'PO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
        status: 'pending',
        created_at: new Date().toISOString(),
        ...reqBody,
      };
      db.purchaseOrders.unshift(newPo);
      saveDb(db);
      return send(newPo, 201);
    }
    if (method === 'PUT') {
      const id = url.split('/').pop();
      const idx = db.purchaseOrders.findIndex((p) => p.id === id);
      if (idx !== -1) {
        db.purchaseOrders[idx] = { ...db.purchaseOrders[idx], ...reqBody };
        saveDb(db);
        return send(db.purchaseOrders[idx]);
      }
      return send({ message: 'PO updated' });
    }
  }

  // 10. Accounting
  if (url.startsWith('/accounting/overview')) {
    const totalRevenue = db.transactions.reduce((acc, t) => acc + (t.total_amount || 0), 485000);
    return send({
      totalRevenueCash: totalRevenue,
      totalExpensesCash: 125000,
      netProfitCash: totalRevenue - 125000,
      totalGoldVaultGrams: db.inventory.reduce((acc, i) => acc + (i.gross_weight || 0), 0),
      totalScrapGoldGrams: 15.7,
      cashBalance: totalRevenue - 53250,
    });
  }

  if (url.startsWith('/accounting/ledger')) {
    return send([
      { id: 'led-1', entry_date: new Date().toISOString(), account_name: 'Cash Register - Main Dubai', description: 'POS Sale Settlement INV-2026-0001', debit_amount: 48500, credit_amount: 0, balance: 48500, currency: 'EGP' },
      { id: 'led-2', entry_date: new Date(Date.now() - 3600000).toISOString(), account_name: 'Supplier Payable - Cairo Refinery', description: 'Raw Gold Bullion Advance Payment', debit_amount: 0, credit_amount: 45000, balance: 3500, currency: 'EGP' },
      { id: 'led-3', entry_date: new Date(Date.now() - 7200000).toISOString(), account_name: 'Gold Inventory Vault 24K', description: 'Vault Inbound Transfer PO-2026-0001', debit_amount: 1000, credit_amount: 0, balance: 1000, currency: 'g 24K' },
    ]);
  }

  // 11. Reports
  if (url.startsWith('/reports/summary')) {
    return send({
      sales: {
        totalRevenue: db.transactions.reduce((acc, t) => acc + (t.total_amount || 0), 485000),
        transactionCount: db.transactions.length || 2,
        averageTicket: 36756,
        buybackOffset: 12400,
      },
      inventory: {
        totalItems: db.inventory.length,
        inStockCount: db.inventory.filter((i) => i.status === 'in_stock').length,
        soldCount: db.inventory.filter((i) => i.status === 'sold').length,
        netGoldWeightGrams: db.inventory.reduce((acc, i) => acc + (i.net_gold_weight || 0), 0),
      },
      customers: {
        totalCustomers: db.customers.length,
        goldBalanceOwedGrams: db.customers.reduce((acc, c) => acc + (c.gold_balance_grams || 0), 0),
        cashBalanceOwed: db.customers.reduce((acc, c) => acc + (c.cash_balance || 0), 0),
      },
      suppliers: {
        totalSuppliers: db.suppliers.length,
        goldReceivableGrams: db.suppliers.reduce((acc, s) => acc + (s.gold_receivable_grams || 0), 0),
        cashPayable: db.suppliers.reduce((acc, s) => acc + (s.cash_payable || 0), 0),
      },
      purchases: {
        totalOrders: db.purchaseOrders.length,
        pendingOrders: db.purchaseOrders.filter((p) => p.status === 'pending').length,
        totalSpend: db.purchaseOrders.reduce((acc, p) => acc + (p.total_cost || 0), 0),
      },
    });
  }

  if (url.startsWith('/reports/recent-sales')) {
    return send(db.transactions);
  }

  // 12. Notifications
  if (url.startsWith('/notifications')) {
    if (method === 'GET') {
      return send(db.notifications);
    }
    if (method === 'PUT') {
      const id = url.split('/')[2];
      const notif = db.notifications.find((n) => n.id === id);
      if (notif) notif.is_read = true;
      saveDb(db);
      return send({ success: true });
    }
  }

  // 13. Audit Logs
  if (url.startsWith('/audit')) {
    return send(db.auditLogs);
  }

  // 14. Users
  if (url.startsWith('/users')) {
    if (method === 'GET') {
      return send(db.users);
    }
    if (method === 'POST') {
      const role = db.roles.find((r) => r.id === reqBody['role_id']) || db.roles[2];
      const branch = db.branches.find((b) => b.id === reqBody['home_branch_id']) || db.branches[0];
      const newUser = {
        id: 'user-' + Date.now(),
        role_name: role.name,
        branch_name: branch.name,
        is_active: true,
        ...reqBody,
      };
      db.users.push(newUser);
      saveDb(db);
      return send(newUser, 201);
    }
    if (method === 'PUT') {
      const id = url.split('/').pop();
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...reqBody };
        saveDb(db);
        return send(db.users[idx]);
      }
      return send({ message: 'User updated' });
    }
    if (method === 'DELETE') {
      const id = url.split('/').pop();
      db.users = db.users.filter((u) => u.id !== id);
      saveDb(db);
      return send({ success: true });
    }
  }

  // 15. Roles
  if (url.startsWith('/roles')) {
    if (method === 'GET') {
      return send(db.roles);
    }
    if (method === 'POST') {
      const newRole = {
        id: 'role-' + Date.now(),
        permissions: [],
        ...reqBody,
      };
      db.roles.push(newRole);
      saveDb(db);
      return send(newRole, 201);
    }
    if (method === 'PUT') {
      const id = url.split('/').pop();
      const idx = db.roles.findIndex((r) => r.id === id);
      if (idx !== -1) {
        db.roles[idx] = { ...db.roles[idx], ...reqBody };
        saveDb(db);
        return send(db.roles[idx]);
      }
      return send({ message: 'Role updated' });
    }
    if (method === 'DELETE') {
      const id = url.split('/').pop();
      db.roles = db.roles.filter((r) => r.id !== id);
      saveDb(db);
      return send({ success: true });
    }
  }

  // 16. Branches / Stores
  if (url.startsWith('/branches') || url.startsWith('/stores')) {
    if (method === 'GET') {
      return send(db.branches);
    }
    if (method === 'POST') {
      const newBranch = {
        id: 'branch-' + Date.now(),
        is_active: true,
        ...reqBody,
      };
      db.branches.push(newBranch);
      saveDb(db);
      return send(newBranch, 201);
    }
    if (method === 'PUT') {
      const id = url.split('/').pop();
      const idx = db.branches.findIndex((b) => b.id === id);
      if (idx !== -1) {
        db.branches[idx] = { ...db.branches[idx], ...reqBody };
        saveDb(db);
        return send(db.branches[idx]);
      }
      return send({ message: 'Branch updated' });
    }
    if (method === 'DELETE') {
      const id = url.split('/').pop();
      db.branches = db.branches.filter((b) => b.id !== id);
      saveDb(db);
      return send({ success: true });
    }
  }

  // Fallback for any other /api endpoint
  return send({ status: 'ok', timestamp: new Date().toISOString() });
};
