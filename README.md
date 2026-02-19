# Transaction System - Wallet Management & Order Processing

A complete transaction system with wallet management for clients and order processing with fulfillment API integration.

## Features

### Backend (Node.js + Express + SQLite)
- ✅ Admin wallet credit/debit operations
- ✅ Client order creation with automatic wallet deduction
- ✅ Fulfillment API integration
- ✅ Wallet balance tracking
- ✅ Complete ledger system
- ✅ Atomic transactions

### Frontend (HTML/CSS/JavaScript)
- ✅ Admin panel for wallet management
- ✅ Client panel for orders and balance
- ✅ Real-time balance updates
- ✅ Order history and transaction ledger
- ✅ Responsive design

## Project Structure

```
task/
├── backend/
│   ├── server.js          # Express API server
│   ├── database.js        # SQLite database setup
│   ├── package.json       # Dependencies
│   └── transaction.db     # SQLite database (created on first run)
│
└── frontend/
    ├── index.html         # Main UI
    ├── styles.css         # Styling
    └── script.js          # Frontend logic
```

## Quick Start (Easiest Way)

### Option 1: Using Startup Scripts

**Windows Batch File:**
```cmd
start.bat
```

**PowerShell:**
```powershell
.\start.ps1
```

This will automatically:
- Start the backend server on port 3000
- Open the frontend in your default browser

### Option 2: Manual Setup

## Installation & Setup

### Backend Setup

1. Navigate to the backend folder:
   ```powershell
   cd backend
   ```

2. Install dependencies (one-time):
   ```powershell
   npm install
   ```

3. Start the server:
   ```powershell
   node server.js
   ```

   The backend will start on `http://localhost:3000`

### Frontend Setup

1. Open the frontend in your browser:
   ```powershell
   start frontend\index.html
   ```

   Or navigate to `frontend\index.html` and double-click it

## API Endpoints

### Admin Endpoints

#### 1. Credit Wallet
```
POST /admin/wallet/credit
Content-Type: application/json

Body:
{
  "client_id": 2,
  "amount": 100.50
}
```

#### 2. Debit Wallet
```
POST /admin/wallet/debit
Content-Type: application/json

Body:
{
  "client_id": 2,
  "amount": 50.00
}
```

### Client Endpoints

#### 3. Create Order
```
POST /orders
Headers:
  client-id: 2
Content-Type: application/json

Body:
{
  "amount": 25.99
}
```

#### 4. Get Order Details
```
GET /orders/{order_id}
Headers:
  client-id: 2
```

#### 5. Get Wallet Balance
```
GET /wallet/balance
Headers:
  client-id: 2
```

### Helper Endpoints

```
GET /clients                    # Get all clients
GET /client/:client_id/orders   # Get client's orders
GET /client/:client_id/ledger   # Get client's transaction history
GET /health                     # Health check
```

## Sample Data

The system initializes with:
- 1 Admin user
- 3 Client users (John Doe, Jane Smith, Bob Johnson)
- Each client starts with $1000 balance

## Database Schema

### Tables

1. **clients** - User information
   - id, name, email, is_admin, created_at

2. **wallets** - Wallet balances
   - id, client_id, balance, updated_at

3. **ledger_entries** - Transaction history
   - id, client_id, transaction_type, amount, balance_after, description, created_at

4. **orders** - Order records
   - id, client_id, amount, status, fulfillment_id, created_at

## How to Use

### Admin Operations

1. Switch to **Admin Panel** tab
2. Select a client from the dropdown
3. Enter amount and click **Credit Wallet** or **Debit Wallet**

### Client Operations

1. Switch to **Client Panel** tab
2. Select a client from the dropdown
3. View wallet balance
4. Create orders by entering amount
5. View order history and transaction ledger
6. Get specific order details by ID

## Testing with cURL

### Credit Wallet
```bash
curl -X POST http://localhost:3000/admin/wallet/credit \
  -H "Content-Type: application/json" \
  -d "{\"client_id\": 2, \"amount\": 100}"
```

### Create Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "client-id: 2" \
  -d "{\"amount\": 50}"
```

### Get Balance
```bash
curl http://localhost:3000/wallet/balance \
  -H "client-id: 2"
```

### Get Order Details
```bash
curl http://localhost:3000/orders/1 \
  -H "client-id: 2"
```

## Key Features Implemented

✅ **Atomic Transactions** - Wallet deductions are atomic with order creation
✅ **Balance Validation** - Insufficient balance is checked before deduction
✅ **Fulfillment API Integration** - Calls external API and stores fulfillment ID
✅ **Complete Ledger** - All transactions are logged with balance snapshots
✅ **Error Handling** - Comprehensive error handling for all operations
✅ **Transaction History** - Complete audit trail for all wallet operations

## Technology Stack

- **Backend**: Node.js, Express.js, SQLite3, Axios
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: SQLite
- **External API**: JSONPlaceholder (for fulfillment simulation)

## Security Notes

This is a demo application. For production use, implement:
- Authentication & Authorization
- Input validation & sanitization
- Rate limiting
- HTTPS/SSL
- Environment variables for configuration
- Database migrations
- Proper error logging

## Troubleshooting

**Port already in use:**
```powershell
# Change PORT in server.js or set environment variable
$env:PORT=3001; npm start
```

**CORS errors:**
- Make sure backend is running on port 3000
- Check that API_URL in script.js matches backend URL

**Database locked:**
- Close all connections and restart the server

## License

MIT
