# Software Requirement Specification (SRS)
## Multi-Tenant Gold & Jewelry SaaS ERP System

---

## 1. Introduction & Scope

This Software Requirement Specification (SRS) details the functional and non-functional requirements of the Multi-Tenant Gold & Jewelry SaaS ERP system. The software manages complex enterprise resources for jewelry retailers, wholesalers, and manufacturing units. It coordinates operations across multiple branches with high-precision inventory tracking and dynamic costing.

---

## 2. Functional Requirements (Module Breakdown)

The ERP consists of 27 integrated modules. The requirements for each module are detailed below.

### 2.1. Authentication & Authorization
* **Multi-Tenant Routing**: Authenticate users against their specific company domain/tenant code (e.g., `tenant-a.gold-erp.com` or header `X-Tenant-ID`).
* **Security Controls**: Support email/password sign-in, MFA (Multi-Factor Authentication) via TOTP, and JSON Web Token (JWT) based stateless sessions with automated Refresh Token rotation.
* **Role-Based Access Control (RBAC)**: Enforce granular resource permissions based on user roles mapped inside the tenant workspace.

### 2.2. Companies Management
* **Super-Admin Interface**: Global platform administrators can create, suspend, and view companies.
* **Company Profiles**: Capture legal name, tax identification (VAT/GST/EIN), base currency (e.g., USD, AED, EUR), base weight units (Grams, Ounces, Pennyweight), and branding assets (logo, custom CSS colors).

### 2.3. Branches Management
* **Multi-Location Hierarchy**: Create branches (Retail Store, Warehouse, Workshop, Consignment Outlet).
* **Branch-Specific Config**: Assign address, local contact details, operating hours, and assign default cash register accounts to each branch.
* **Branch Access Limits**: Restrict standard user logins to their assigned home branch.

### 2.4. Users & Roles
* **User Provisioning**: Invite users via email, activate/deactivate accounts, and edit profile data.
* **Role Customizer**: Create custom roles with checkbox permissions corresponding to read, write, edit, delete, and approve rights per module.

### 2.5. Customers Management
* **KYC Integration**: Store customer photo ID, address proof, phone number, and tax registration (mandatory for transactions exceeding regulatory thresholds, e.g., AML laws).
* **Loyalty & Balance**: Track historical sales, loyalty points, customer gold accounts (ledger of gold grams deposited by/owed to the customer), and outstanding receivables.

### 2.6. Suppliers Management
* **Metal Account Balances**: Maintain a double-entry ledger of both cash balance and raw gold weight balances owed to each refiner/supplier.
* **Supplier Types**: Differentiate between casting houses, gemstone dealers, refiners, and finished goods wholesalers.

### 2.7. Products Management
* **Dynamic Specifications**: Support product configurations including metal type (Gold, Silver, Platinum), karat purity (18K, 21K, 22K, 24K), weight, and stone content.
* **Catalog Management**: Create, edit, and organize product categories. Define custom pricing formulas.

### 2.8. Gold Items Management
* **Weight Fields**: Store Gross Weight, Net Gold Weight, and wastage tolerances.
* **Calculations**: Gold Value = Net Weight × Current Gold Rate × Purity Factor.
* **Dual Stock Valuation**: Display items in stock sheets with both count and physical gold weight.

### 2.9. Diamond Items Management
* **Gemstone Inventory**: Store diamond dimensions, cut, color, clarity, carat weight, and cert numbers.
* **Pricing Models**: Support pricing by piece, by carat weight, or according to Rapaport price sheets.

### 2.10. Categories Management
* **Category Trees**: Support nested hierarchies (e.g., Rings > Engagement Rings > Solitaires).
* **Attribute Inheritance**: Auto-apply default making charges and wastage margins to all child items in a category.

### 2.11. Inventory Management
* **Barcode Generation**: Auto-generate unique serial numbers. Print tags containing metal karat, gross weight, net weight, stone weight, and price.
* **Stock Count Audits**: Support barcode scanner inputs for periodic physical reconciliation against system records, generating difference logs.

### 2.12. Stock Transfers
* **Inter-Branch Requests**: Raise transfer requests, track items in transit, and require target branch acceptance to complete updates.
* **Transit Insurance Logs**: Record carrier details and value cover for security audits.

### 2.13. Purchasing
* **Raw Material Intake**: Log purchases of raw bullion, gold scrap, or loose diamonds.
* **Finished Goods Inflow**: Record intake of manufactured jewelry, with direct conversion of making charges and metal weights.

### 2.14. Sales
* **POS Checkout**: Process sales using barcode scans, applying live gold rate calculations.
* **Flexible Payments**: Support split payments (Cash + Card + Customer Gold Trade-In).

### 2.15. Returns
* **Return Policy Logic**: Enforce refund rules based on original purchase weights and gold rates.
* **Scrap Reclassification**: Automatically route returned gold jewelry to a scrap inventory category for melting.

### 2.16. Quotations
* **Pro-Forma Quotations**: Create formal customer quotes with lock-in options (e.g., gold price locked for 24 hours).
* **Dynamic Conversions**: Auto-convert approved quotes directly into active orders.

### 2.17. Orders
* **Custom Jewelry Work Orders**: Register custom customer requests, capture design drawings/sketches, collect advanced deposit funds, and route tasks to workshops.
* **Status Milestones**: Track progress from design approval through 3D printing, casting, polishing, stone setting, QC, and delivery.

### 2.18. Cash Management
* **Cash Drawer Control**: Open and close daily register sessions, reconcile cash inputs, and log cash discrepancies.
* **Vault Transfers**: Log secure physical transfers between POS tills and the branch safe.

### 2.19. Expenses
* **Expense Categorization**: Register operating costs (rent, security, electricity, insurance).
* **Voucher Uploads**: Store scans of receipts in cloud storage (Cloudinary) for tax reviews.

### 2.20. Accounting
* **Double-Entry General Ledger**: Auto-post debits and credits for inventory changes, sales, and payments.
* **Balance Sheet & P&L**: Dynamic financial statements showing business health, accounting for metal asset appreciation/depreciation.

### 2.21. Invoices
* **Custom Invoice Engine**: Print thermal POS receipts or full A4/letter invoices with customizable company headers, logos, and legal terms.
* **Digital Distribution**: Send PDF invoices automatically via WhatsApp and Email.

### 2.22. Reports
* **Custom Query Builder**: Export custom spreadsheets for sales, stock levels, and staff performance.
* **Multi-Format Export**: Support CSV, Excel, and PDF downloads.

### 2.23. Dashboard
* **Real-Time KPI Widgets**: Show sales, active inventory weight, workshop throughput, and gold market charts.
* **Notifications Center**: Display alerts for low-stock items or pending transfer requests.

### 2.24. Notifications
* **Omnichannel Messaging**: Send SMS, email, and WhatsApp notifications for order milestones and payment reminders.
* **Trigger Engine**: Auto-trigger alerts based on system events.

### 2.25. Audit Logs
* **System Event Recorder**: Log all events with IP address, timestamp, tenant ID, user ID, and detailed changes.
* **Immutability**: Prevent editing or deleting audit logs.

### 2.26. Settings
* **Operational Rules**: Configure dynamic setting templates for VAT rules, grace periods, and API integrations.
* **Default Pricing Adjustments**: Manage margins added to standard wholesale gold feeds.

### 2.27. Subscription Management
* **SaaS Billing Portal**: View plan usage, check invoice history, and handle upgrades/downgrades via payment gateways.
* **Automatic Expiry Lock**: Restrict workspace access when subscription payments fail.

---

## 3. Gold Industry Specific Features & Pricing Calculations

### 3.1. Price Calculation Engine
Every gold jewelry item has its sales price calculated dynamically using the formula:

$$\text{Retail Price} = \left[ (\text{Net Gold Weight} + \text{Wastage Weight}) \times \text{Current Gold Rate} \times \frac{\text{Karat Purity}}{24} \right] + \text{Making Charges} + \text{Stone Charges}$$

Where:
* **Karat Purity Factor**: 24K = 1.000, 22K = 0.9167, 21K = 0.875, 18K = 0.750.
* **Wastage Weight**: calculated as $\text{Net Gold Weight} \times \text{Wastage \%}$.
* **Making Charges**: can be a flat fee per item or a variable fee per gram.

```
Example Calculation:
- Gross Weight: 10.00g, Net Gold Weight: 8.00g (Stones: 2.00g)
- Karat: 18K (0.750 purity)
- Live Gold Spot Price (24K): $70.00 / gram
- Wastage: 5% (8.00g * 0.05 = 0.40g)
- Making Charges: $10.00 / gram of Net Weight (8.00g * $10.00 = $80.00)
- Stone Charges: $150.00 (Total value of mounted stones)
- Calculation:
  Metal Value = (8.00g + 0.40g) * ($70.00 * 0.750) = 8.40g * $52.50 = $441.00
  Total Cost  = $441.00 (Metal) + $80.00 (Making) + $150.00 (Stones) = $671.00
```

### 3.2. Live Gold Price Integration
* **Real-time Feeds**: Connect with commodity API feeds to pull spot gold prices (updated every 60 seconds).
* **Manual Overrides**: Allow managers to lock gold prices for defined periods to prevent POS price changes during volatile market hours.

### 3.3. Gold Buyback and Scrap Melting
* **Buyback Validation**: Record customer details, verify identification documents, weigh scrap metal, run purity tests, and generate transaction receipts.
* **Melting Log**: Record raw inputs (e.g., jewelry scrap totaling 50g) and output weight of the refined bullion bar, documenting any melting losses.

### 3.4. Jewelry Manufacturing Tracking
* **Job Cards**: Track items through various stages of production (Casting, Filing, Setting, Polishing).
* **Metal Balance Sheets**: Reconcile allocated raw gold weight against output item weights to monitor loss rates.

---

## 4. Non-Functional Requirements (NFR)

### 4.1. Security & Data Isolation
* **Tenant Isolation**: Separate all tenant data using logical database schemas or tenant-specific foreign keys combined with Row-Level Security (RLS).
* **Data Encryption**: Encrypt all data in transit using TLS 1.3, and encrypt sensitive database columns (e.g., identity keys, credit card tokens) at rest using AES-256.

### 4.2. Performance & Availability
* **POS Responsiveness**: Keep page loads under 1 second, and complete barcode scans in under 200 milliseconds.
* **System Uptime**: Maintain a 99.9% uptime target, using load balancers and database replicas to handle spikes in traffic.

### 4.3. Scalability
* **High-Throughput Handling**: Ensure the system can scale horizontally to support high volumes of concurrent transactions across thousands of active store branches.
* **Caching**: Use Redis cache clusters to store hot data (such as live gold rates and catalog configurations) to minimize database load.
