# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   (HTML/CSS/JavaScript)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Admin Panel    │         │   Client Panel   │         │
│  ├──────────────────┤         ├──────────────────┤         │
│  │ • Credit Wallet  │         │ • View Balance   │         │
│  │ • Debit Wallet   │         │ • Create Order   │         │
│  │ • Select Client  │         │ • View Orders    │         │
│  └──────────────────┘         │ • View Ledger    │         │
│                                └──────────────────┘         │
│                                                              │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP/REST
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                   BACKEND API SERVER                         │
│                 (Node.js + Express.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │              API ENDPOINTS                              ││
│  ├────────────────────────────────────────────────────────┤│
│  │                                                         ││
│  │  Admin Endpoints:                                       ││
│  │  • POST /admin/wallet/credit                           ││
│  │  • POST /admin/wallet/debit                            ││
│  │                                                         ││
│  │  Client Endpoints:                                      ││
│  │  • POST /orders                                         ││
│  │  • GET  /orders/:order_id                              ││
│  │  • GET  /wallet/balance                                ││
│  │                                                         ││
│  │  Helper Endpoints:                                      ││
│  │  • GET  /clients                                        ││
│  │  • GET  /client/:id/orders                             ││
│  │  • GET  /client/:id/ledger                             ││
│  │  • GET  /health                                         ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
└────────────────┬──────────────────────────┬──────────────────┘
                 │                          │
                 │ SQLite                   │ HTTPS
                 │                          │
┌────────────────▼─────────────┐  ┌─────────▼───────────────┐
│         DATABASE             │  │   FULFILLMENT API       │
│         (SQLite)             │  │  (jsonplaceholder...)   │
├──────────────────────────────┤  └─────────────────────────┘
│                              │
│  Tables:                     │
│  ┌────────────────────────┐ │
│  │ clients                │ │
│  │ • id                   │ │
│  │ • name                 │ │
│  │ • email                │ │
│  │ • is_admin             │ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ wallets                │ │
│  │ • id                   │ │
│  │ • client_id (FK)       │ │
│  │ • balance              │ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ ledger_entries         │ │
│  │ • id                   │ │
│  │ • client_id (FK)       │ │
│  │ • transaction_type     │ │
│  │ • amount               │ │
│  │ • balance_after        │ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ orders                 │ │
│  │ • id                   │ │
│  │ • client_id (FK)       │ │
│  │ • amount               │ │
│  │ • status               │ │
│  │ • fulfillment_id       │ │
│  └────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

## Transaction Flow - Create Order

```
┌─────────┐                ┌─────────┐               ┌──────────┐            ┌─────────────┐
│ Client  │                │  API    │               │ Database │            │ Fulfillment │
│ Browser │                │ Server  │               │          │            │     API     │
└────┬────┘                └────┬────┘               └────┬─────┘            └──────┬──────┘
     │                          │                         │                          │
     │  POST /orders            │                         │                          │
     │  {amount: 25.50}         │                         │                          │
     ├─────────────────────────>│                         │                          │
     │                          │                         │                          │
     │                          │ 1. Get wallet balance   │                          │
     │                          ├────────────────────────>│                          │
     │                          │<────────────────────────┤                          │
     │                          │                         │                          │
     │                          │ 2. Validate balance     │                          │
     │                          │    (balance >= amount)  │                          │
     │                          │                         │                          │
     │                          │ 3. Update wallet        │                          │
     │                          │    (balance - amount)   │                          │
     │                          ├────────────────────────>│                          │
     │                          │<────────────────────────┤                          │
     │                          │                         │                          │
     │                          │ 4. Create ledger entry  │                          │
     │                          ├────────────────────────>│                          │
     │                          │<────────────────────────┤                          │
     │                          │                         │                          │
     │                          │ 5. Create order         │                          │
     │                          ├────────────────────────>│                          │
     │                          │<────────────────────────┤                          │
     │                          │                         │                          │
     │                          │ 6. Call fulfillment API                            │
     │                          │    POST /posts                                     │
     │                          ├───────────────────────────────────────────────────>│
     │                          │<───────────────────────────────────────────────────┤
     │                          │    {id: 101}            │                          │
     │                          │                         │                          │
     │                          │ 7. Update order with    │                          │
     │                          │    fulfillment_id       │                          │
     │                          ├────────────────────────>│                          │
     │                          │<────────────────────────┤                          │
     │                          │                         │                          │
     │  Response:               │                         │                          │
     │  {                       │                         │                          │
     │    order_id: 1,          │                         │                          │
     │    fulfillment_id: 101,  │                         │                          │
     │    new_balance: 974.50   │                         │                          │
     │  }                       │                         │                          │
     │<─────────────────────────┤                         │                          │
     │                          │                         │                          │
```

## Data Flow

### Credit Wallet
```
Admin → API → Update Wallet → Create Ledger Entry → Response
```

### Debit Wallet
```
Admin → API → Validate Balance → Update Wallet → Create Ledger Entry → Response
```

### Create Order
```
Client → API → Validate Balance → Update Wallet → Create Ledger Entry 
     → Create Order → Call Fulfillment API → Update Order → Response
```

### Get Balance
```
Client → API → Query Wallet → Response
```

### Get Order Details
```
Client → API → Query Order → Response
```

## Technology Stack

```
Frontend Layer
├── HTML5
├── CSS3
└── Vanilla JavaScript

Backend Layer
├── Node.js (Runtime)
├── Express.js (Web Framework)
├── SQLite3 (Database Driver)
└── Axios (HTTP Client)

Database Layer
└── SQLite (Relational Database)

External Services
└── JSONPlaceholder API (Fulfillment Service)
```

## Key Features

### ✅ Atomic Transactions
- Wallet updates and order creation happen atomically
- Rollback on failure
- Consistent state guaranteed

### ✅ Data Integrity
- Foreign key constraints
- Balance validation
- Transaction logging
- Timestamps on all operations

### ✅ Error Handling
- Input validation
- Insufficient balance checks
- API failure handling
- Graceful degradation

### ✅ Audit Trail
- Complete ledger of all transactions
- Balance snapshots
- Transaction descriptions
- Timestamps

## Security Model

```
Current (Demo):
┌─────────────┐
│   Client    │
│   Header    │
└──────┬──────┘
       │
       ▼
   ┌───────┐
   │  API  │
   └───────┘

Production (Recommended):
┌─────────────┐
│   Client    │
│   + JWT     │
└──────┬──────┘
       │
       ▼
   ┌──────────┐
   │   Auth   │
   │ Middleware│
   └─────┬────┘
       │
       ▼
   ┌───────┐
   │  API  │
   └───────┘
```

## Deployment Architecture

```
Development:
┌──────────────────────────────────┐
│  Local Machine                   │
│  ├── Backend (localhost:3000)    │
│  ├── Frontend (file://)          │
│  └── SQLite (transaction.db)     │
└──────────────────────────────────┘

Production (Recommended):
┌─────────────────────────────────────────┐
│  Cloud Platform (AWS/Azure/GCP)         │
│  ├── Load Balancer                      │
│  ├── Application Servers (Node.js)      │
│  ├── Database (PostgreSQL/MySQL)        │
│  ├── Static Hosting (Frontend)          │
│  ├── Caching Layer (Redis)              │
│  └── Monitoring & Logging                │
└─────────────────────────────────────────┘
```

## File Structure

```
task/
│
├── backend/
│   ├── node_modules/          # Dependencies
│   ├── database.js            # Database setup & schema
│   ├── server.js              # Express API server
│   ├── package.json           # Node dependencies
│   ├── package-lock.json      # Dependency lock file
│   └── transaction.db         # SQLite database (runtime)
│
├── frontend/
│   ├── index.html             # Main UI
│   ├── styles.css             # Styling
│   └── script.js              # Frontend logic & API calls
│
├── README.md                  # Project documentation
├── TESTING.md                 # Testing documentation
├── ARCHITECTURE.md            # This file
├── start.bat                  # Windows startup script
└── start.ps1                  # PowerShell startup script
```

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

## Performance Considerations

- Database indexes on foreign keys
- Connection pooling (for production)
- Caching frequently accessed data
- Rate limiting on API endpoints
- Query optimization
- Async/await for non-blocking operations

## Scalability

### Current Capacity
- Handles moderate concurrent users
- SQLite limitations for concurrent writes

### Scale-Up Strategy
1. Replace SQLite with PostgreSQL/MySQL
2. Implement connection pooling
3. Add Redis for caching
4. Horizontal scaling with load balancer
5. Database replication
6. Queue system for async operations
