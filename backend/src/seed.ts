import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const ddl = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS inventory_audit_log CASCADE;
DROP TABLE IF EXISTS job_card_materials CASCADE;
DROP TABLE IF EXISTS job_cards CASCADE;
DROP TABLE IF EXISTS repair_orders CASCADE;
DROP TABLE IF EXISTS melting_records CASCADE;
DROP TABLE IF EXISTS gold_buybacks CASCADE;
DROP TABLE IF EXISTS sales_items CASCADE;
DROP TABLE IF EXISTS sales_transactions CASCADE;
DROP TABLE IF EXISTS stock_transfer_items CASCADE;
DROP TABLE IF EXISTS stock_transfers CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS gold_price_history CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_branches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 1. TENANTS & CONFIG
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    base_currency CHAR(3) DEFAULT 'USD',
    base_weight_unit VARCHAR(10) DEFAULT 'gram',
    logo_url VARCHAR(1024),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    branch_type VARCHAR(50) DEFAULT 'retail',
    address TEXT,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES & PERMISSIONS
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    access_level VARCHAR(20) NOT NULL DEFAULT 'none',
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    home_branch_id UUID REFERENCES branches(id),
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

CREATE TABLE user_branches (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, branch_id)
);

-- 3. CUSTOMERS & SUPPLIERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    gold_balance_grams NUMERIC(12, 4) DEFAULT 0.0000,
    cash_balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(255),
    gold_receivable_grams NUMERIC(12, 4) DEFAULT 0.0000,
    cash_payable NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. CATEGORIES & PRODUCTS
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    default_making_charge_gram NUMERIC(10, 2) DEFAULT 0.00,
    default_wastage_percent NUMERIC(5, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    metal_type VARCHAR(30) DEFAULT 'gold',
    karat VARCHAR(10) DEFAULT '21K',
    standard_making_charge NUMERIC(10, 2) DEFAULT 0.00,
    making_charge_type VARCHAR(20) DEFAULT 'per_gram',
    standard_wastage_percent NUMERIC(5, 2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, sku)
);

CREATE TABLE gold_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    karat VARCHAR(10) NOT NULL,
    price_per_gram NUMERIC(12, 4) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    source VARCHAR(100) DEFAULT 'feed_api',
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. INVENTORY & CERTIFICATES
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    product_id UUID REFERENCES products(id),
    barcode VARCHAR(100) UNIQUE NOT NULL,
    gross_weight NUMERIC(12, 4) NOT NULL CHECK (gross_weight > 0),
    net_gold_weight NUMERIC(12, 4) NOT NULL CHECK (net_gold_weight <= gross_weight),
    stone_weight NUMERIC(12, 4) DEFAULT 0.0000,
    gold_karat VARCHAR(10) NOT NULL DEFAULT '21K',
    making_charge_rate NUMERIC(10, 2) DEFAULT 0.00,
    making_charge_type VARCHAR(20) DEFAULT 'per_gram',
    stone_charge NUMERIC(15, 2) DEFAULT 0.00,
    wastage_percent NUMERIC(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. SALES TRANSACTIONS & ITEMS
CREATE TABLE sales_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    user_id UUID NOT NULL REFERENCES users(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    gold_rate_applied_24k NUMERIC(12, 4) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'paid',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_transaction_id UUID NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    gold_rate_applied NUMERIC(12, 4) NOT NULL,
    metal_value_calculated NUMERIC(15, 2) NOT NULL,
    making_charge_applied NUMERIC(15, 2) NOT NULL,
    stone_charge_applied NUMERIC(15, 2) NOT NULL,
    final_item_price NUMERIC(15, 2) NOT NULL
);

-- 7. OPERATIONS
CREATE TABLE gold_buybacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    associated_sale_id UUID REFERENCES sales_transactions(id),
    metal_type VARCHAR(30) DEFAULT 'gold',
    claimed_karat VARCHAR(10) NOT NULL,
    tested_purity_percent NUMERIC(5, 2) NOT NULL,
    gross_weight NUMERIC(12, 4) NOT NULL,
    net_weight NUMERIC(12, 4) NOT NULL,
    buyback_rate_applied NUMERIC(12, 4) NOT NULL,
    total_valuation NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash_refund',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enforcement
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON inventory_items
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
`;

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'gold_jewelry_erp',
  });

  try {
    await client.connect();
    console.log('Running DDL Schema...');
    await client.query(ddl);

    // Seed Data
    console.log('Seeding Data...');
    const tenantId = 'e1a7b445-568d-4e96-a1ad-4672bb192bb3';
    await client.query(`
      INSERT INTO tenants (id, name, subdomain) 
      VALUES ('${tenantId}', 'Gold Premium Corp', 'premium') 
      ON CONFLICT DO NOTHING
    `);

    const branchId = 'c47cf08a-2be5-4f40-b6ab-1d37e6f3161c';
    await client.query(`
      INSERT INTO branches (id, tenant_id, name, branch_type) 
      VALUES ('${branchId}', '${tenantId}', 'Main Store Dubai', 'retail') 
      ON CONFLICT DO NOTHING
    `);

    // 1. Seed Permissions
    const permissions = [
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a01', name: 'Dashboard.View', module: 'Dashboard', desc: 'View dashboard metrics' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a02', name: 'Sales.View', module: 'Sales', desc: 'View sales records' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a03', name: 'Sales.Create', module: 'Sales', desc: 'Create sales transactions' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a04', name: 'Sales.Return', module: 'Sales', desc: 'Perform sales returns' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a05', name: 'Inventory.View', module: 'Inventory', desc: 'View inventory items' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a06', name: 'Inventory.Create', module: 'Inventory', desc: 'Add new inventory items' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a07', name: 'Inventory.Edit', module: 'Inventory', desc: 'Edit inventory items' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a08', name: 'Inventory.Transfer', module: 'Inventory', desc: 'Transfer stock' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a09', name: 'Purchases.View', module: 'Purchases', desc: 'View purchase records' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a10', name: 'Purchases.Create', module: 'Purchases', desc: 'Add new purchase records' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a11', name: 'Customers.View', module: 'Customers', desc: 'View customer details' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a12', name: 'Customers.Create', module: 'Customers', desc: 'Create customer accounts' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a13', name: 'Reports.View', module: 'Reports', desc: 'View reports' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a14', name: 'Reports.Export', module: 'Reports', desc: 'Export reports' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a15', name: 'Accounting.View', module: 'Accounting', desc: 'View accounts' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a16', name: 'Accounting.Edit', module: 'Accounting', desc: 'Manage ledger' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a17', name: 'Users.Manage', module: 'Users', desc: 'Manage users' },
      { id: '111fcfb0-5712-4211-bc6e-cfbf16790a18', name: 'Settings.Manage', module: 'Settings', desc: 'Manage system settings' },
    ];

    for (const p of permissions) {
      await client.query(`
        INSERT INTO permissions (id, name, module, description) 
        VALUES ('${p.id}', '${p.name}', '${p.module}', '${p.desc}') 
        ON CONFLICT DO NOTHING
      `);
    }

    // 2. Seed Roles
    const roles = [
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

    for (const r of roles) {
      await client.query(`
        INSERT INTO roles (id, tenant_id, name, is_system) 
        VALUES ('${r.id}', '${tenantId}', '${r.name}', true) 
        ON CONFLICT DO NOTHING
      `);
    }

    // 3. Seed Role Permissions
    const rpMappings: { roleId: string; permName: string; level: 'write' | 'read' }[] = [];

    // Owner gets everything (write)
    permissions.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a31', permName: p.name, level: 'write' }));

    // Branch Manager
    const managerWrite = ['Dashboard.View', 'Sales.View', 'Sales.Create', 'Sales.Return', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Transfer', 'Purchases.View', 'Purchases.Create', 'Customers.View', 'Customers.Create', 'Reports.View', 'Reports.Export'];
    const managerRead = ['Accounting.View'];
    managerWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a32', permName: p, level: 'write' }));
    managerRead.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a32', permName: p, level: 'read' }));

    // Sales / Cashier
    const cashierWrite = ['Dashboard.View', 'Sales.View', 'Sales.Create', 'Sales.Return', 'Customers.View', 'Customers.Create'];
    cashierWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a33', permName: p, level: 'write' }));

    // Inventory Officer
    const invWrite = ['Dashboard.View', 'Inventory.View', 'Inventory.Create', 'Inventory.Edit', 'Inventory.Transfer', 'Purchases.View', 'Purchases.Create'];
    invWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a34', permName: p, level: 'write' }));

    // Purchasing Officer
    const purchWrite = ['Dashboard.View', 'Purchases.View', 'Purchases.Create'];
    const purchRead = ['Inventory.View'];
    purchWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a35', permName: p, level: 'write' }));
    purchRead.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a35', permName: p, level: 'read' }));

    // Accountant
    const accWrite = ['Dashboard.View', 'Reports.View', 'Reports.Export', 'Accounting.View', 'Accounting.Edit'];
    const accRead = ['Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View'];
    accWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a36', permName: p, level: 'write' }));
    accRead.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a36', permName: p, level: 'read' }));

    // Auditor
    const audWrite = ['Dashboard.View'];
    const audRead = ['Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', 'Reports.View', 'Accounting.View'];
    audWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a37', permName: p, level: 'write' }));
    audRead.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a37', permName: p, level: 'read' }));

    // Support / Admin
    const adminWrite = ['Dashboard.View', 'Users.Manage', 'Settings.Manage'];
    adminWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a38', permName: p, level: 'write' }));

    // Viewer
    const viewWrite = ['Dashboard.View'];
    const viewRead = ['Sales.View', 'Inventory.View', 'Purchases.View', 'Customers.View', 'Reports.View', 'Accounting.View'];
    viewWrite.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a39', permName: p, level: 'write' }));
    viewRead.forEach(p => rpMappings.push({ roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a39', permName: p, level: 'read' }));

    for (const mapping of rpMappings) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id, access_level) 
        VALUES ('${mapping.roleId}', (SELECT id FROM permissions WHERE name = '${mapping.permName}'), '${mapping.level}') 
        ON CONFLICT DO NOTHING
      `);
    }

    // 4. Seed Users
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const testUsers = [
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c1', name: 'Owner User', email: 'owner@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a31' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c2', name: 'Manager User', email: 'manager@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a32' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c3', name: 'Cashier User', email: 'cashier@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a33' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c4', name: 'Inventory User', email: 'inventory@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a34' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c5', name: 'Purchasing User', email: 'purchasing@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a35' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c6', name: 'Accountant User', email: 'accountant@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a36' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c7', name: 'Auditor User', email: 'auditor@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a37' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c8', name: 'Admin User', email: 'admin@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a38' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0c9', name: 'Viewer User', email: 'viewer@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a39' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d1', name: 'Youssef Mansour', email: 'youssef@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a33' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d2', name: 'Fatima Zahra', email: 'fatima@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a36' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d3', name: 'Hassan Ibrahim', email: 'hassan@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a32' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d4', name: 'Nour El Din', email: 'nour@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a37' },
      { id: '8a326a0a-1153-4876-b9bd-6a84c6c9a0d5', name: 'Mona Zaki', email: 'mona@test.com', roleId: '919fcfb0-5712-4211-bc6e-cfbf16790a39' },
    ];

    for (const u of testUsers) {
      await client.query(`
        INSERT INTO users (id, tenant_id, role_id, name, email, password_hash, home_branch_id) 
        VALUES ('${u.id}', '${tenantId}', '${u.roleId}', '${u.name}', '${u.email}', '${hash}', '${branchId}') 
        ON CONFLICT DO NOTHING
      `);
    }

    const categoryId = '342cf1a0-5321-432d-96e0-826d70830491';
    await client.query(`
      INSERT INTO categories (id, tenant_id, name, default_making_charge_gram, default_wastage_percent) 
      VALUES ('${categoryId}', '${tenantId}', 'Rings', 10.00, 5.00) 
      ON CONFLICT DO NOTHING
    `);

    const productId = '4955c4d3-4672-4752-bf66-d3098f981e4b';
    await client.query(`
      INSERT INTO products (id, tenant_id, category_id, sku, name, metal_type, karat) 
      VALUES ('${productId}', '${tenantId}', '${categoryId}', 'RNG-21K', 'Golden Band Ring', 'gold', '21K') 
      ON CONFLICT DO NOTHING
    `);

    // Enable Session variables to insert into RLS-protected table
    await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}';`);
    await client.query(`
      INSERT INTO inventory_items (
        tenant_id, branch_id, product_id, barcode, gross_weight, 
        net_gold_weight, gold_karat, making_charge_rate, 
        making_charge_type, stone_charge, wastage_percent
      ) VALUES 
        ('${tenantId}', '${branchId}', '${productId}', 'RNG-21K-00941', 8.5000, 7.0000, '21K', 12.00, 'per_gram', 150.00, 5.00),
        ('${tenantId}', '${branchId}', '${productId}', 'RNG-21K-00942', 12.0000, 10.0000, '21K', 10.00, 'per_gram', 0.00, 5.00)
      ON CONFLICT DO NOTHING
    `);

    const customerId = '8ab3b92d-94c0-4ad9-a78d-608bfa0c8cde';
    await client.query(`
      INSERT INTO customers (id, tenant_id, name, phone, email) 
      VALUES ('${customerId}', '${tenantId}', 'John Doe', '+971500000000', 'john@gmail.com') 
      ON CONFLICT DO NOTHING
    `);

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await client.end();
  }
}

seed();
