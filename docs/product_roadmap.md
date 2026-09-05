# Product Roadmap
## Multi-Tenant Gold & Jewelry SaaS ERP System

---

## 1. Roadmap Timeline Overview

The development of the Multi-Tenant Gold & Jewelry SaaS ERP is structured across four phases over a 12-month period, building a foundation of secure multi-tenant inventory control before expanding to retail operations, workshop logistics, and enterprise scale.

```
Months:  1   2   3   4   5   6   7   8   9   10  11  12
Phase 1: [=======MVP=======]
Phase 2:                 [===Multi-Branch===]
Phase 3:                                 [==Mfg/Workshops==]
Phase 4:                                                 [==Scale/White-Label==]
```

---

## 2. Phase Breakdown & Execution

### Phase 1: Minimum Viable Product (MVP) - Core Systems
* **Timeline**: Months 1 - 4
* **Priority**: Critical / Core Foundation
* **Target Features**:
  * Multi-Tenant logical infrastructure setup (PostgreSQL Row-Level Security policies).
  * Authentication (JWT, dynamic Tenant extraction, roles mapping).
  * Products catalog (weights inputs, karats settings, basic category templates).
  * Single-branch inventory tracking (manual gross/net gold weight, barcode print tags).
  * Live Gold Price integration (API pooling, cached pricing engine, POS price calculator).
  * Sales & POS Module (simple cash/card transaction checkout, sales invoice generation).
* **Estimated Effort**: 480 Person-Days (6,400 hours)
* **Suggested Team Sizing**:
  * 1 Project Manager / Business Analyst
  * 1 UI/UX Designer
  * 2 Frontend Engineers (Angular)
  * 2 Backend Engineers (NestJS/PostgreSQL)
  * 1 QA Engineer

---

### Phase 2: Multi-Branch Networks & Client Channels
* **Timeline**: Months 5 - 7
* **Priority**: High / Expansion
* **Target Features**:
  * Branches & Locations Management (Retail, Warehouse, Workshop profiles).
  * Stock Transfers (Branch routing request approvals, transit insurance logs).
  * Customer CRM (KYC documents uploads, metal accounts balance sheets).
  * Supplier Management (Refiner metadata, raw metals payable ledger).
  * WhatsApp and Twilio SMS integrations (queued automated invoice deliveries).
  * Expenses & Cash Register Drawer audits (Register sessions, safe transfers).
* **Estimated Effort**: 360 Person-Days (4,800 hours)
* **Suggested Team Sizing**:
  * 1 Project Manager
  * 3 Frontend Engineers
  * 3 Backend Engineers
  * 2 QA Engineers

---

### Phase 3: Manufacturing & Artisan Workshop Logistics
* **Timeline**: Months 8 - 10
* **Priority**: Medium / Specific Verticals
* **Target Features**:
  * Jewelry Manufacturing Module (Job cards creation, progress statuses, casting/setting logs).
  * Workshop raw material tracking (gold fine allocation, alloy mixing, scrap reclamation).
  * Gold Melting Records (pre/post melt weights recording, automated wastage loss logs).
  * Repair Orders (broken intake photos, solder alloy weight adjustments, goldsmith assignees).
  * Certificate Management (GIA, IGI certificate attachments, database associations).
  * Double-entry Ledger system (Integration of general ledger accounts, automated balance sheets).
* **Estimated Effort**: 360 Person-Days (4,800 hours)
* **Suggested Team Sizing**:
  * 1 Solution Architect / PM
  * 3 Frontend Engineers
  * 4 Backend/Database Engineers
  * 2 QA Engineers

---

### Phase 4: Enterprise Scale, White-Labeling & Analytics
* **Timeline**: Months 11 - 12
* **Priority**: Low / Commercial Optimization
* **Target Features**:
  * Dynamic SaaS Billing Integration (Stripe subscription tiers, automated access suspension).
  * Custom Tenant settings (white-label domain configurations, customized CSS styles, custom emails).
  * Advanced Analytics (real-time store performance dashboards, metal asset valuation logs).
  * Database optimizations (Ledger table partitions, read replicas routing).
  * Offline-POS sync capability (local index storage, reconciliation sync on network reconnect).
* **Estimated Effort**: 240 Person-Days (3,200 hours)
* **Suggested Team Sizing**:
  * 1 Solution Architect
  * 2 Frontend Engineers
  * 3 Backend/DevOps Engineers
  * 2 QA Engineers

---

## 3. Risk Assessment & Mitigation Matrix

| Identified Risk | Impact Level | Mitigation Strategy |
| :--- | :---: | :--- |
| **Metal Value Calculation Discrepancies** | **HIGH** | Force the use of PostgreSQL `NUMERIC` types with 4 decimal places for weights and 2 decimal places for currencies. Never use floating-point types (`float`, `real`, `double precision`) in code or database columns for calculations. |
| **Data Leakage Between Tenants** | **CRITICAL** | Set up automated integration tests that attempt to query data from a second tenant ID under an authenticated first tenant session, asserting a `403 Forbidden` response. Enforce PostgreSQL Row-Level Security (RLS) policies at the DB layer. |
| **POS Performance Lag during Market Volatility** | **HIGH** | Cache gold rates in Redis with a 60-second expiration. Implement Client-Side Rate-Locks (up to 4 hours) so active POS checkout operations do not call live APIs on every barcode scan. |
| **Workshop Metal Theft / Loss** | **MEDIUM** | Enforce a "Dual-Signature Verification" process within the workflow. Both the allocating manager and the goldsmith must digitally sign (using credentials) the raw material weights at job start and return stages. |
