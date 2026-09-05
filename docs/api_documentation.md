# API Documentation
## Multi-Tenant Gold & Jewelry SaaS ERP System

---

## 1. Global API Standards

### Base URL & Headers
All requests must include the tenant context and authorization headers.
* **Base URL**: `https://api.jewelry-saas.com/v1`
* **Headers**:
  * `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  * `X-Tenant-ID: <TENANT_UUID>`
  * `Content-Type: application/json`

### Standard Error Response Format
```json
{
  "statusCode": 400,
  "message": ["weight must be greater than 0", "karat must be one of: 18K, 21K, 22K, 24K"],
  "error": "Bad Request",
  "timestamp": "2026-06-14T20:00:00.000Z",
  "path": "/v1/inventory/items"
}
```

---

## 2. Core API Endpoints

### 2.1. Authentication
#### `POST /auth/login`
* **Description**: Logs in a user for a specific tenant and returns JWT access and refresh tokens.
* **Request Body**:
  ```json
  {
    "email": "cashier@tenant-a.com",
    "password": "SecurePassword123!",
    "tenantId": "e1a7b445-568d-4e96-a1ad-4672bb192bb3"
  }
  ```
* **Validation Rules**:
  * `email`: Must be a valid email format.
  * `password`: String, minimum 8 characters.
  * `tenantId`: Must be a valid UUID.
* **Response Body (`200 OK`)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d2c77d56-02bc-44eb-bd41-4775d713c7a9",
    "expiresIn": 900,
    "user": {
      "id": "78326a0a-1153-4876-b9bd-6a84c6c9a0c7",
      "name": "Raj Kumar",
      "email": "cashier@tenant-a.com",
      "role": "Sales Associate",
      "branchId": "c47cf08a-2be5-4f40-b6ab-1d37e6f3161c"
    }
  }
  ```

---

### 2.2. Live Gold Prices
#### `GET /gold-prices/live`
* **Description**: Retrieves current gold spot rate for all standard karat purities inside the tenant's base currency.
* **Response Body (`200 OK`)**:
  ```json
  {
    "timestamp": "2026-06-14T19:35:00Z",
    "baseCurrency": "USD",
    "rates": {
      "24K": 75.3250,
      "22K": 69.0479,
      "21K": 65.9093,
      "18K": 56.4937
    },
    "source": "Kitco Metals API",
    "isLocked": false
  }
  ```

#### `POST /gold-prices/lock`
* **Description**: Locks the POS billing rate to protect against sudden market shifts during active sales sessions.
* **Request Body**:
  ```json
  {
    "karat": "21K",
    "lockRate": 66.10,
    "durationMinutes": 60
  }
  ```
* **Validation Rules**:
  * `karat`: Must be one of `18K`, `21K`, `22K`, `24K`.
  * `lockRate`: Positive float, up to 4 decimal places.
  * `durationMinutes`: Int, max 240.
* **Response Body (`201 Created`)**:
  ```json
  {
    "lockId": "342cf1a0-5321-432d-96e0-826d70830491",
    "karat": "21K",
    "lockedRate": 66.10,
    "expiresAt": "2026-06-14T20:35:00Z"
  }
  ```

---

### 2.3. Inventory Management
#### `POST /inventory/items`
* **Description**: Creates a new individual item instance with precise weight and cost metrics.
* **Request Body**:
  ```json
  {
    "productId": "4955c4d3-4672-4752-bf66-d3098f981e4b",
    "branchId": "c47cf08a-2be5-4f40-b6ab-1d37e6f3161c",
    "barcode": "RNG-21K-00941",
    "grossWeight": 8.5020,
    "netGoldWeight": 7.2000,
    "goldKarat": "21K",
    "makingChargeRate": 8.50,
    "makingChargeType": "per_gram",
    "stoneCharge": 120.00,
    "wastagePercent": 4.50
  }
  ```
* **Validation Rules**:
  * `grossWeight`: Positive float, required.
  * `netGoldWeight`: Positive float, must be $\le$ `grossWeight`.
  * `goldKarat`: Must match tenant karat configuration list.
  * `makingChargeType`: Enum `["per_gram", "fixed"]`.
* **Response Body (`201 Created`)**:
  ```json
  {
    "id": "e81cf26b-1932-4d2d-80f4-52d12ca7d75a",
    "barcode": "RNG-21K-00941",
    "grossWeight": 8.5020,
    "netGoldWeight": 7.2000,
    "stoneWeight": 1.3020,
    "status": "in_stock",
    "calculatedBasePrice": 594.54
  }
  ```

---

### 2.4. Sales POS Checkout
#### `POST /sales/transactions`
* **Description**: Creates a sales transaction invoice, updates inventory item status to `sold`, and updates customer trade-in ledger accounts.
* **Request Body**:
  ```json
  {
    "customerId": "8ab3b92d-94c0-4ad9-a78d-608bfa0c8cde",
    "branchId": "c47cf08a-2be5-4f40-b6ab-1d37e6f3161c",
    "items": [
      {
        "inventoryItemId": "e81cf26b-1932-4d2d-80f4-52d12ca7d75a",
        "goldRateApplied": 65.9093,
        "makingChargeApplied": 61.20,
        "stoneChargeApplied": 120.00,
        "finalPrice": 678.86
      }
    ],
    "buybacks": [
      {
        "claimedKarat": "18K",
        "testedPurityPercent": 75.00,
        "grossWeight": 10.0000,
        "netWeight": 10.0000,
        "buybackRateApplied": 56.4937,
        "totalValuation": 564.94
      }
    ],
    "discountAmount": 10.00,
    "taxAmount": 5.20,
    "paymentMethod": "split",
    "cashPaid": 109.12,
    "cardPaid": 0.00
  }
  ```
* **Validation Rules**:
  * `items`: Array of items, minimum 1 item if no buyback scrap-inflow is recorded.
  * `cashPaid` + `cardPaid` + `buybacks.totalValuation`: Must match total invoice amount within $\pm0.01$ rounding tolerance.
* **Response Body (`201 Created`)**:
  ```json
  {
    "invoiceNumber": "INV-2026-000491",
    "transactionId": "592fcfb0-5712-4211-bc6e-cfbf16790a3d",
    "totalAmount": 673.86,
    "netDue": 0.00,
    "paymentStatus": "paid",
    "whatsappNotificationStatus": "queued"
  }
  ```

---

### 2.5. Gold Buyback (Stand-alone Scrap Intake)
#### `POST /gold-buybacks`
* **Description**: Processes direct purchase of scrap gold from retail walk-ins. Requires customer verification data.
* **Request Body**:
  ```json
  {
    "customerId": "8ab3b92d-94c0-4ad9-a78d-608bfa0c8cde",
    "branchId": "c47cf08a-2be5-4f40-b6ab-1d37e6f3161c",
    "claimedKarat": "18K",
    "testedPurityPercent": 74.80,
    "grossWeight": 25.5000,
    "netWeight": 25.0000,
    "buybackRateApplied": 55.90,
    "verificationIdUrl": "https://cloudinary.com/tenant-a/ids/cust_592.jpg"
  }
  ```
* **Response Body (`201 Created`)**:
  ```json
  {
    "buybackId": "912ffea0-2a3b-411a-82ee-0cc7d9b93222",
    "receiptNumber": "BB-2026-00104",
    "purityLossAdjusted": 0.05,
    "settlementAmount": 1397.50,
    "status": "pending_melting"
  }
  ```

---

### 2.6. Manufacturing Job Cards
#### `POST /manufacturing/job-cards`
* **Description**: Launches a jewelry creation work order in a manufacturing workshop, deducting raw metal weights from inventory allocations.
* **Request Body**:
  ```json
  {
    "workshopId": "d82ff02a-921a-4a0b-bc3b-82d8d89a74a1",
    "jobNumber": "JC-77901",
    "productSku": "RNG-SOL-09",
    "targetKarat": "18K",
    "allocatedGoldWeight": 150.0000,
    "materials": [
      {
        "materialType": "gold_fine_24k",
        "weight": 112.5000
      },
      {
        "materialType": "alloy_copper_zinc",
        "weight": 37.5000
      }
    ]
  }
  ```
* **Response Body (`201 Created`)**:
  ```json
  {
    "jobCardId": "e30cf821-2a1c-43bc-a4aa-c11ef8d7e7d9",
    "jobNumber": "JC-77901",
    "currentStage": "casting_allocated",
    "totalAllocatedWeight": 150.0000,
    "expectedPurity": "18K (75.00%)"
  }
  ```
