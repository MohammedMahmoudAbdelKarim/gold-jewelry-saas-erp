import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);
  public isMockMode = false;

  // In-Memory Database Storage for Mock Mode Fallback
  public mockUsers: any[] = [];
  public mockRoles: any[] = [];
  public mockBranches: any[] = [];
  public mockCustomers: any[] = [];
  public mockSuppliers: any[] = [];
  public mockPurchaseOrders: any[] = [];
  public mockNotifications: any[] = [];
  public mockAuditLog: any[] = [];
  public mockInventory: any[] = [];
  public mockTransactions: any[] = [];
  public mockBuybacks: any[] = [];

  async onModuleInit() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'gold_jewelry_erp',
      max: 5,
      connectionTimeoutMillis: 1000, // fail quickly if offline
    });

    try {
      // Test connect
      const client = await this.pool.connect();
      client.release();
      this.logger.log('Successfully connected to PostgreSQL database.');
    } catch (err) {
      this.isMockMode = true;
      this.logger.warn(
        'PostgreSQL is not reachable on port 5432. Falling back to IN-MEMORY MOCK DATABASE MODE.',
      );
      await this.initializeMockData();
    }
  }

  getMockPermissionsForRole(roleName: string): string[] {
    const dashboard = ['Dashboard.View'];
    const sales = ['Sales.View', 'Sales.Create', 'Sales.Return'];
    const inventory = ['Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Transfer'];
    const purchases = ['Purchases.View', 'Purchases.Create', 'Purchases.Edit'];
    const customers = ['Customers.View', 'Customers.Create', 'Customers.Edit'];
    const reports = ['Reports.View', 'Reports.Export'];
    const accounting = ['Accounting.View', 'Accounting.Edit'];
    const users = ['Users.Manage'];
    const settings = ['Settings.Manage'];

    const r = roleName.toLowerCase();
    if (r === 'owner') {
      return [...dashboard, ...sales, ...inventory, ...purchases, ...customers, ...reports, ...accounting, ...users, ...settings];
    }
    if (r === 'branch manager' || r === 'manager') {
      return [...dashboard, ...sales, ...inventory, ...purchases, ...customers, ...reports, 'Accounting.View'];
    }
    if (r === 'sales / cashier' || r === 'sales associate' || r === 'cashier') {
      return [...dashboard, ...sales, ...customers];
    }
    if (r === 'inventory officer' || r === 'inventory specialist') {
      return [...dashboard, ...inventory, ...purchases];
    }
    if (r === 'purchasing officer') {
      return [...dashboard, 'Inventory.View', ...purchases];
    }
    if (r === 'accountant') {
      return [...dashboard, 'Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', ...reports, ...accounting];
    }
    if (r === 'auditor') {
      return [...dashboard, 'Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', 'Reports.View', 'Accounting.View'];
    }
    if (r === 'support / admin' || r === 'admin') {
      return [...dashboard, ...users, ...settings];
    }
    if (r === 'viewer') {
      return [...dashboard, 'Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', 'Reports.View', 'Accounting.View'];
    }
    return [];
  }

  async initializeMockData() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    this.mockBranches = [
      { id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c', tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3', name: 'Main Store Dubai', branch_type: 'retail', location: 'Dubai Mall', is_active: true },
      { id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161d', tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3', name: 'Cairo Branch', branch_type: 'retail', location: 'Cairo Festival City', is_active: true },
      { id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161e', tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3', name: 'Jebel Ali Central Warehouse', branch_type: 'warehouse', location: 'JAFZA Zone 4', is_active: true },
    ];

    const rolesList = [
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a31', name: 'Owner' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a32', name: 'Branch Manager' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a33', name: 'Sales / Cashier' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a34', name: 'Inventory Officer' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a35', name: 'Purchasing Officer' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a36', name: 'Accountant' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a37', name: 'Auditor' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a38', name: 'Support / Admin' },
      { id: '919fcfb0-5712-4211-bc6e-cfbf16790a39', name: 'Viewer' },
    ];
    this.mockRoles = rolesList.map(r => ({
      ...r,
      permissions: this.getMockPermissionsForRole(r.name)
    }));

    this.mockUsers = [
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a31',
        name: 'Owner User',
        email: 'owner@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Owner',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a32',
        name: 'Manager User',
        email: 'manager@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Branch Manager',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c3',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a33',
        name: 'Cashier User',
        email: 'cashier@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Sales / Cashier',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c4',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a34',
        name: 'Inventory User',
        email: 'inventory@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Inventory Officer',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c5',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a35',
        name: 'Purchasing User',
        email: 'purchasing@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Purchasing Officer',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c6',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a36',
        name: 'Accountant User',
        email: 'accountant@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Accountant',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c7',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a37',
        name: 'Auditor User',
        email: 'auditor@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Auditor',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c8',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a38',
        name: 'Admin User',
        email: 'admin@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Support / Admin',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c9',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a39',
        name: 'Viewer User',
        email: 'viewer@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Viewer',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a33',
        name: 'Youssef Mansour',
        email: 'youssef@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Sales / Cashier',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a36',
        name: 'Fatima Zahra',
        email: 'fatima@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Accountant',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d3',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a32',
        name: 'Hassan Ibrahim',
        email: 'hassan@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Branch Manager',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d4',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a37',
        name: 'Nour El Din',
        email: 'nour@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Auditor',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
      {
        id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d5',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        role_id: '919fcfb0-5712-4211-bc6e-cfbf16790a39',
        name: 'Mona Zaki',
        email: 'mona@test.com',
        password_hash: hash,
        home_branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        role_name: 'Viewer',
        branch_name: 'Main Store Dubai',
        is_active: true,
      },
    ];

    this.mockInventory = [
      {
        id: 'item-1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        barcode: 'RNG-21K-00941',
        gross_weight: 8.5,
        net_gold_weight: 7.0,
        gold_karat: '21K',
        making_charge_rate: 12.0,
        making_charge_type: 'per_gram',
        stone_charge: 150.0,
        wastage_percent: 5.0,
        status: 'in_stock',
        product_name: 'Golden Band Ring',
        product_sku: 'RNG-21K',
      },
      {
        id: 'item-2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        barcode: 'RNG-21K-00942',
        gross_weight: 12.0,
        net_gold_weight: 10.0,
        gold_karat: '21K',
        making_charge_rate: 10.0,
        making_charge_type: 'per_gram',
        stone_charge: 0.0,
        wastage_percent: 5.0,
        status: 'in_stock',
        product_name: 'Classic Gold Ring',
        product_sku: 'RNG-21K',
      },
      {
        id: 'item-3',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        barcode: 'NKL-22K-01050',
        gross_weight: 25.0,
        net_gold_weight: 22.5,
        gold_karat: '22K',
        making_charge_rate: 15.0,
        making_charge_type: 'per_gram',
        stone_charge: 0.0,
        wastage_percent: 3.0,
        status: 'in_stock',
        product_name: 'Rope Chain Necklace',
        product_sku: 'NKL-22K',
      },
      {
        id: 'item-4',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        barcode: 'BRC-18K-00733',
        gross_weight: 18.0,
        net_gold_weight: 14.5,
        gold_karat: '18K',
        making_charge_rate: 20.0,
        making_charge_type: 'per_gram',
        stone_charge: 450.0,
        wastage_percent: 4.0,
        status: 'in_stock',
        product_name: 'Diamond Accent Bracelet',
        product_sku: 'BRC-18K',
      },
      {
        id: 'item-5',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        barcode: 'EAR-24K-00215',
        gross_weight: 5.2,
        net_gold_weight: 5.0,
        gold_karat: '24K',
        making_charge_rate: 18.0,
        making_charge_type: 'per_gram',
        stone_charge: 0.0,
        wastage_percent: 2.0,
        status: 'in_stock',
        product_name: 'Pure Gold Drop Earrings',
        product_sku: 'EAR-24K',
      },
      {
        id: 'item-6',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        barcode: 'PND-21K-00860',
        gross_weight: 6.8,
        net_gold_weight: 5.5,
        gold_karat: '21K',
        making_charge_rate: 14.0,
        making_charge_type: 'per_gram',
        stone_charge: 200.0,
        wastage_percent: 3.5,
        status: 'in_stock',
        product_name: 'Ruby Heart Pendant',
        product_sku: 'PND-21K',
      },
    ];

    this.mockCustomers = [
      {
        id: 'cust-1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        name: 'Ahmed Al Mansoori',
        phone: '+971501234567',
        email: 'ahmed.mansoori@example.com',
        id_type: 'National ID',
        id_number: '784-1985-1234567-1',
        gold_balance_grams: 12.5,
        cash_balance: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cust-2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        name: 'Layla Hussein',
        phone: '+971502345678',
        email: 'layla.hussein@example.com',
        id_type: 'Passport',
        id_number: 'P1234567',
        gold_balance_grams: 0,
        cash_balance: 850.0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cust-3',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        name: 'Omar Khaled',
        phone: '+971503456789',
        email: '',
        id_type: 'Driving License',
        id_number: 'DL-99213',
        gold_balance_grams: 3.2,
        cash_balance: 0,
        created_at: new Date().toISOString(),
      },
    ];

    this.mockSuppliers = [
      {
        id: 'supp-1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        company_name: 'Cairo Gold Refinery Co.',
        contact_name: 'Hassan Fathy',
        phone: '+20 1012223344',
        email: 'sales@cairogoldrefinery.com',
        gold_receivable_grams: 0,
        cash_payable: 45000.0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'supp-2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        company_name: 'Al Nasr Bullion Trading',
        contact_name: 'Mona Adel',
        phone: '+20 1123334455',
        email: 'mona@alnasrbullion.com',
        gold_receivable_grams: 120.5,
        cash_payable: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'supp-3',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        company_name: 'Deira Precious Metals LLC',
        contact_name: 'Rami Aoun',
        phone: '+971 501112233',
        email: '',
        gold_receivable_grams: 0,
        cash_payable: 8250.0,
        created_at: new Date().toISOString(),
      },
    ];

    this.mockPurchaseOrders = [
      {
        id: 'po-1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        supplier_id: 'supp-1',
        user_id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c1',
        po_number: 'PO-2026-0001',
        item_description: '1kg 24K gold bullion bar',
        gold_karat: '24K',
        weight_grams: 1000,
        unit_cost_per_gram: 3800,
        total_cost: 3800000,
        status: 'received',
        notes: 'Delivered to Cairo HQ vault',
        created_at: new Date().toISOString(),
      },
      {
        id: 'po-2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        branch_id: 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c',
        supplier_id: 'supp-2',
        user_id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c1',
        po_number: 'PO-2026-0002',
        item_description: '21K scrap gold, assorted',
        gold_karat: '21K',
        weight_grams: 500,
        unit_cost_per_gram: 3300,
        total_cost: 1650000,
        status: 'pending',
        notes: '',
        created_at: new Date().toISOString(),
      },
    ];

    this.mockNotifications = [
      {
        id: 'notif-1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        title: 'Low Stock Alert',
        message: '21K Golden Band Ring (RNG-21K-00941) is running low on stock.',
        type: 'warning',
        is_read: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        title: 'New Sale Completed',
        message: 'A new sale transaction was completed at Main Store Dubai.',
        type: 'success',
        is_read: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-3',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        title: 'Gold Price Updated',
        message: '24K gold rate updated to 3,850 EGP/g.',
        type: 'info',
        is_read: true,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-4',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        title: 'Purchase Order Received',
        message: 'PO-2026-0001 from Cairo Gold Refinery Co. was marked as received.',
        type: 'success',
        is_read: true,
        created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      },
    ];

    this.mockAuditLog = [
      {
        id: 'audit-seed-1',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        user_email: 'owner@test.com',
        action: 'login',
        entity_type: 'auth',
        entity_id: undefined,
        details: 'Owner User signed in',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'audit-seed-2',
        tenant_id: 'e1a7b445-568d-4e96-a1ad-4672bb192bb3',
        user_email: 'owner@test.com',
        action: 'create',
        entity_type: 'customer',
        entity_id: 'cust-1',
        details: 'Created customer "Ahmed Al Mansoori"',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async onModuleDestroy() {
    if (!this.isMockMode) {
      await this.pool.end();
    }
  }

  // Generic query executor with mock fallback
  async query(
    text: string,
    params?: any[],
  ): Promise<{ rows: any[]; rowCount: number }> {
    if (!this.isMockMode) {
      const res = await this.pool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount };
    }

    const cleanSql = text.replace(/\s+/g, ' ').trim();

    // Intercept permission query
    if (cleanSql.includes('role_permissions') || cleanSql.includes('FROM role_permissions')) {
      const roleId = params?.[0];
      const user = this.mockUsers.find((u) => u.role_id === roleId);
      const roleName = user ? user.role_name : 'Owner';
      const perms = this.getMockPermissionsForRole(roleName);
      return { rows: perms.map((p) => ({ name: p })), rowCount: perms.length };
    }

    // 1. User login query
    if (
      cleanSql.includes('FROM users u') &&
      cleanSql.includes('u.email = $1')
    ) {
      const email = params?.[0];
      const user = this.mockUsers.find((u) => u.email === email);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    // 2. Barcode query
    if (
      cleanSql.includes('FROM inventory_items i') &&
      (cleanSql.includes('barcode = $2') || cleanSql.includes('i.barcode = $2'))
    ) {
      const barcode = params?.[1];
      const item = this.mockInventory.find(
        (i) => i.barcode === barcode && i.status === 'in_stock',
      );
      return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
    }

    // 3. Branch items query
    if (
      cleanSql.includes('FROM inventory_items i') &&
      (cleanSql.includes('branch_id = $2') ||
        cleanSql.includes('i.branch_id = $2'))
    ) {
      const branchId = params?.[1];
      const items = this.mockInventory.filter((i) => i.branch_id === branchId);
      return { rows: items, rowCount: items.length };
    }

    // 4. Roles query
    if (cleanSql.includes('FROM roles')) {
      return { rows: this.mockRoles, rowCount: this.mockRoles.length };
    }

    // 5. Branches query
    if (cleanSql.includes('FROM branches')) {
      let rows = this.mockBranches;
      if (cleanSql.includes('is_active = true')) {
        rows = this.mockBranches.filter(b => b.is_active);
      }
      return { rows, rowCount: rows.length };
    }

    // 6. User update query
    if (cleanSql.includes('UPDATE users')) {
      const id = params?.[0];
      const user = this.mockUsers.find((u) => u.id === id);
      if (user) {
        if (cleanSql.includes('name = $')) {
          const idx = parseInt(cleanSql.split('name = $')[1]) - 1;
          user.name = params?.[idx];
        }
        if (cleanSql.includes('email = $')) {
          const idx = parseInt(cleanSql.split('email = $')[1]) - 1;
          user.email = params?.[idx];
        }
        if (cleanSql.includes('role_id = $')) {
          const idx = parseInt(cleanSql.split('role_id = $')[1]) - 1;
          user.role_id = params?.[idx];
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a31') user.role_name = 'Owner';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a32') user.role_name = 'Branch Manager';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a33') user.role_name = 'Sales / Cashier';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a34') user.role_name = 'Inventory Officer';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a35') user.role_name = 'Purchasing Officer';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a36') user.role_name = 'Accountant';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a37') user.role_name = 'Auditor';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a38') user.role_name = 'Support / Admin';
          if (user.role_id === '919fcfb0-5712-4211-bc6e-cfbf16790a39') user.role_name = 'Viewer';
        }
        if (cleanSql.includes('home_branch_id = $')) {
          const idx = parseInt(cleanSql.split('home_branch_id = $')[1]) - 1;
          user.home_branch_id = params?.[idx];
          user.branch_name = user.home_branch_id === 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c' ? 'Main Store Dubai' : 'Cairo Branch';
        }
        if (cleanSql.includes('is_active = $')) {
          const idx = parseInt(cleanSql.split('is_active = $')[1]) - 1;
          user.is_active = params?.[idx];
        }
        if (cleanSql.includes('avatar_url = $')) {
          const idx = parseInt(cleanSql.split('avatar_url = $')[1]) - 1;
          user.avatar_url = params?.[idx] || null;
        }
        if (cleanSql.includes('phone = $')) {
          const idx = parseInt(cleanSql.split('phone = $')[1]) - 1;
          user.phone = params?.[idx] || null;
        }
        if (cleanSql.includes('address = $')) {
          const idx = parseInt(cleanSql.split('address = $')[1]) - 1;
          user.address = params?.[idx] || null;
        }
        return { rows: [user], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 7. Insert User query
    if (cleanSql.includes('INSERT INTO users')) {
      const tenantId = params?.[0];
      const roleId = params?.[1];
      const name = params?.[2];
      const email = params?.[3];
      const hash = params?.[4];
      const homeBranchId = params?.[5] || null;
      const avatarUrl = params?.[6] || null;
      const phone = params?.[7] || null;
      const address = params?.[8] || null;

      let roleName = 'Sales / Cashier';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a31') roleName = 'Owner';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a32') roleName = 'Branch Manager';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a33') roleName = 'Sales / Cashier';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a34') roleName = 'Inventory Officer';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a35') roleName = 'Purchasing Officer';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a36') roleName = 'Accountant';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a37') roleName = 'Auditor';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a38') roleName = 'Support / Admin';
      if (roleId === '919fcfb0-5712-4211-bc6e-cfbf16790a39') roleName = 'Viewer';

      const newUser = {
        id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
        tenant_id: tenantId,
        role_id: roleId,
        name: name,
        email: email,
        password_hash: hash,
        home_branch_id: homeBranchId,
        role_name: roleName,
        branch_name: homeBranchId === 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c' ? 'Main Store Dubai' : 'Cairo Branch',
        is_active: true,
        avatar_url: avatarUrl,
        phone: phone,
        address: address,
      };

      this.mockUsers.push(newUser);
      return { rows: [newUser], rowCount: 1 };
    }

    // 8. Delete user query
    if (cleanSql.includes('DELETE FROM users')) {
      const id = params?.[0];
      const prevLen = this.mockUsers.length;
      this.mockUsers = this.mockUsers.filter((u) => u.id !== id);
      return { rows: [], rowCount: prevLen - this.mockUsers.length };
    }

    // 9. Check user exists query
    if (cleanSql.includes('SELECT id FROM users WHERE email = $1')) {
      const email = params?.[0];
      const exists = this.mockUsers.some((u) => u.email === email);
      return { rows: exists ? [{ id: 'exists' }] : [], rowCount: exists ? 1 : 0 };
    }

    // 10. List all users query (findAll)
    if (cleanSql.includes('FROM users u') && !cleanSql.includes('u.email = $1')) {
      return { rows: this.mockUsers, rowCount: this.mockUsers.length };
    }

    // Branch CRUD operations mock
    if (cleanSql.includes('INSERT INTO branches')) {
      const tenantId = params?.[0];
      const name = params?.[1];
      const type = params?.[2] || 'retail';
      const location = params?.[3] || null;
      
      const newBranch = {
        id: 'mock-branch-' + Math.random().toString(36).substr(2, 9),
        tenant_id: tenantId,
        name: name,
        branch_type: type,
        location: location,
        is_active: true,
      };
      this.mockBranches.push(newBranch);
      return { rows: [newBranch], rowCount: 1 };
    }

    if (cleanSql.includes('UPDATE branches')) {
      const id = params?.[0];
      const branch = this.mockBranches.find((b) => b.id === id);
      if (branch) {
        if (cleanSql.includes('name = $')) {
          const idx = parseInt(cleanSql.split('name = $')[1]) - 1;
          branch.name = params?.[idx];
        }
        if (cleanSql.includes('branch_type = $')) {
          const idx = parseInt(cleanSql.split('branch_type = $')[1]) - 1;
          branch.branch_type = params?.[idx];
        }
        if (cleanSql.includes('location = $')) {
          const idx = parseInt(cleanSql.split('location = $')[1]) - 1;
          branch.location = params?.[idx];
        }
        if (cleanSql.includes('is_active = $')) {
          const idx = parseInt(cleanSql.split('is_active = $')[1]) - 1;
          branch.is_active = params?.[idx];
        }
        return { rows: [branch], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSql.includes('DELETE FROM branches')) {
      const id = params?.[0];
      const prevLen = this.mockBranches.length;
      this.mockBranches = this.mockBranches.filter((b) => b.id !== id);
      return { rows: [], rowCount: prevLen - this.mockBranches.length };
    }

    // 11. Delete inventory item query
    if (cleanSql.includes('DELETE FROM inventory_items')) {
      const id = params?.[0];
      const prevLen = this.mockInventory.length;
      this.mockInventory = this.mockInventory.filter((i) => i.id !== id);
      return { rows: [], rowCount: prevLen - this.mockInventory.length };
    }

    // 12. Update inventory item query
    if (cleanSql.includes('UPDATE inventory_items') && !cleanSql.includes("SET status = 'sold'")) {
      const id = params?.[0];
      const item = this.mockInventory.find((i) => i.id === id);
      if (item) {
        if (params?.[2] !== undefined && params?.[2] !== null) item.gross_weight = params?.[2];
        if (params?.[3] !== undefined && params?.[3] !== null) item.net_gold_weight = params?.[3];
        if (params?.[4] !== undefined && params?.[4] !== null) item.gold_karat = params?.[4];
        if (params?.[5] !== undefined && params?.[5] !== null) item.making_charge_rate = params?.[5];
        if (params?.[6] !== undefined && params?.[6] !== null) item.making_charge_type = params?.[6];
        if (params?.[7] !== undefined && params?.[7] !== null) item.stone_charge = params?.[7];
        if (params?.[8] !== undefined && params?.[8] !== null) item.wastage_percent = params?.[8];
        if (params?.[9] !== undefined && params?.[9] !== null) item.status = params?.[9];
        return { rows: [item], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }

  async getClientForTenant(
    tenantId: string,
    userEmail: string,
  ): Promise<PoolClient> {
    if (this.isMockMode) {
      return this.createMockClient() as any;
    }
    const client = await this.pool.connect();
    await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}';`);
    await client.query(`SET LOCAL app.current_user_email = '${userEmail}';`);
    return client;
  }

  async runTransaction<T>(
    tenantId: string,
    userEmail: string,
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    if (this.isMockMode) {
      const mockClient = this.createMockClient();
      return callback(mockClient as any);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `SELECT set_config('app.current_tenant_id', $1, true)`,
        [tenantId],
      );
      await client.query(
        `SELECT set_config('app.current_user_email', $2, true)`,
        [userEmail],
      );
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private createMockClient() {
    return {
      query: async (text: string, params?: any[]) => {
        const cleanSql = text.replace(/\s+/g, ' ').trim();

        // Intercept role permissions query inside transaction
        if (cleanSql.includes('role_permissions') || cleanSql.includes('FROM role_permissions')) {
          const roleId = params?.[0];
          const user = this.mockUsers.find((u) => u.role_id === roleId);
          const roleName = user ? user.role_name : 'Owner';
          const perms = this.getMockPermissionsForRole(roleName);
          return { rows: perms.map((p) => ({ name: p })), rowCount: perms.length };
        }

        // Register / Create user
        if (cleanSql.includes('INSERT INTO users')) {
          const user = {
            id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
            tenant_id: params?.[1],
            role_id: params?.[2],
            name: params?.[0],
            email: params?.[3],
            password_hash: params?.[4],
          };
          this.mockUsers.push(user);
          return { rows: [user], rowCount: 1 };
        }

        // Create inventory item
        if (cleanSql.includes('INSERT INTO inventory_items')) {
          const item = {
            id: 'mock-item-' + Math.random().toString(36).substr(2, 9),
            tenant_id: params?.[0],
            branch_id: params?.[1],
            product_id: params?.[2],
            barcode: params?.[3],
            gross_weight: params?.[4],
            net_gold_weight: params?.[5],
            gold_karat: params?.[6],
            making_charge_rate: params?.[7],
            making_charge_type: params?.[8],
            stone_charge: params?.[9],
            wastage_percent: params?.[10],
            status: 'in_stock',
            product_name: 'Golden Band Ring',
            product_sku: 'RNG-21K',
          };
          this.mockInventory.push(item);
          return { rows: [item], rowCount: 1 };
        }

        // Mark item sold
        if (cleanSql.includes("UPDATE inventory_items SET status = 'sold'")) {
          const id = params?.[0];
          const item = this.mockInventory.find((i) => i.id === id);
          if (item) {
            item.status = 'sold';
            return { rowCount: 1 };
          }
          return { rowCount: 0 };
        }

        // Delete inventory item query inside transaction
        if (cleanSql.includes('DELETE FROM inventory_items')) {
          const id = params?.[0];
          const prevLen = this.mockInventory.length;
          this.mockInventory = this.mockInventory.filter((i) => i.id !== id);
          return { rows: [], rowCount: prevLen - this.mockInventory.length };
        }

        // Update inventory item query inside transaction
        if (cleanSql.includes('UPDATE inventory_items')) {
          const id = params?.[0];
          const item = this.mockInventory.find((i) => i.id === id);
          if (item) {
            if (params?.[2] !== undefined && params?.[2] !== null) item.gross_weight = params?.[2];
            if (params?.[3] !== undefined && params?.[3] !== null) item.net_gold_weight = params?.[3];
            if (params?.[4] !== undefined && params?.[4] !== null) item.gold_karat = params?.[4];
            if (params?.[5] !== undefined && params?.[5] !== null) item.making_charge_rate = params?.[5];
            if (params?.[6] !== undefined && params?.[6] !== null) item.making_charge_type = params?.[6];
            if (params?.[7] !== undefined && params?.[7] !== null) item.stone_charge = params?.[7];
            if (params?.[8] !== undefined && params?.[8] !== null) item.wastage_percent = params?.[8];
            if (params?.[9] !== undefined && params?.[9] !== null) item.status = params?.[9];
            return { rows: [item], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }

        // Add sales transaction
        if (cleanSql.includes('INSERT INTO sales_transactions')) {
          const tx = {
            id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
            tenant_id: params?.[0],
            branch_id: params?.[1],
            customer_id: params?.[2],
            user_id: params?.[3],
            invoice_number: params?.[4],
            gold_rate_applied_24k: params?.[5],
            subtotal: params?.[6],
            tax_amount: params?.[7],
            discount_amount: params?.[8],
            total_amount: params?.[9],
          };
          this.mockTransactions.push(tx);
          return { rows: [tx], rowCount: 1 };
        }

        // Add gold buybacks
        if (cleanSql.includes('INSERT INTO gold_buybacks')) {
          const bb = {
            id: 'mock-bb-' + Math.random().toString(36).substr(2, 9),
            tenant_id: params?.[0],
            branch_id: params?.[1],
            customer_id: params?.[2],
            associated_sale_id: params?.[3],
            claimed_karat: params?.[4],
            tested_purity_percent: params?.[5],
            gross_weight: params?.[6],
            net_weight: params?.[7],
            buyback_rate_applied: params?.[8],
            total_valuation: params?.[9],
          };
          this.mockBuybacks.push(bb);
          return { rows: [bb], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      },
      release: () => {},
    };
  }
}
