# Frontend User Guide

## 🎨 User Interface Overview

The frontend is organized into two main panels accessible via tabs:
- **Admin Panel** - For wallet management
- **Client Panel** - For customer operations

---

## 👨‍💼 Admin Panel

### Purpose
Manage wallet balances for all clients in the system.

### Features

#### 1. Credit Wallet
**What it does:** Adds money to a client's wallet

**How to use:**
1. Select a client from the "Credit Wallet" dropdown
2. Enter the amount to add (e.g., 150.75)
3. Click "Credit Wallet" button
4. See success message with new balance

**Example:**
```
Client: John Doe
Amount: $150.75
Result: "Successfully credited $150.75 to client. New balance: $1150.75"
```

---

#### 2. Debit Wallet
**What it does:** Removes money from a client's wallet

**How to use:**
1. Select a client from the "Debit Wallet" dropdown
2. Enter the amount to deduct (e.g., 50.00)
3. Click "Debit Wallet" button
4. See success message with new balance

**Example:**
```
Client: Jane Smith
Amount: $50.00
Result: "Successfully debited $50.00 from client. New balance: $950.00"
```

**Note:** ⚠️ Will show error if insufficient balance

---

## 👤 Client Panel

### Purpose
Allow clients to manage their orders and view their wallet.

### Features

#### 1. Select Client
**What it does:** Choose which client account to view

**How to use:**
1. Click the dropdown at the top
2. Select a client (John Doe, Jane Smith, or Bob Johnson)
3. All client information loads automatically

---

#### 2. Wallet Balance
**What it shows:** Current available balance

**Features:**
- Large, clear display of balance
- Updates automatically after transactions
- "Refresh Balance" button for manual update

**Visual:**
```
┌─────────────────────────┐
│   💳 Wallet Balance     │
│                         │
│      $1,000.00         │
│                         │
│  [Refresh Balance]      │
└─────────────────────────┘
```

---

#### 3. Create Order
**What it does:** Creates a new order and deducts amount from wallet

**How to use:**
1. Ensure you have selected a client
2. Check your balance is sufficient
3. Enter order amount (e.g., 25.50)
4. Click "Create Order"
5. System will:
   - Deduct amount from wallet
   - Create order record
   - Call fulfillment API
   - Store fulfillment ID
   - Show success message

**Success Message Shows:**
- Order ID
- Amount
- Status (fulfilled or fulfillment_failed)
- Fulfillment ID
- New wallet balance

**Example:**
```
✅ Order created successfully!
Order ID: 1
Amount: $25.50
Status: fulfilled
Fulfillment ID: 101
New Balance: $974.50
```

**Validation:**
- ❌ Cannot create order if balance is insufficient
- ❌ Amount must be greater than 0

---

#### 4. My Orders
**What it shows:** All orders for the selected client

**Features:**
- Auto-loads when client is selected
- Shows most recent orders first
- Click "Refresh Orders" to update
- Each order shows:
  - Order ID
  - Amount
  - Fulfillment ID
  - Timestamp
  - Status badge (color-coded)

**Status Badges:**
- 🟢 **fulfilled** - Order completed successfully
- 🟡 **pending** - Order in progress
- 🔴 **fulfillment_failed** - External API failed

**Visual:**
```
┌─────────────────────────────────────────────┐
│ Order #1                        [fulfilled] │
│ Amount: $25.50 | Fulfillment: 101           │
│ 2/19/2026, 3:45:30 PM                      │
├─────────────────────────────────────────────┤
│ Order #2                        [pending]   │
│ Amount: $50.00 | Fulfillment: N/A          │
│ 2/19/2026, 2:30:15 PM                      │
└─────────────────────────────────────────────┘
```

---

#### 5. Get Order Details
**What it does:** Look up specific order by ID

**How to use:**
1. Enter an order ID number
2. Click "Get Details"
3. View complete order information

**Shows:**
- Order ID
- Client ID
- Amount
- Status
- Fulfillment ID
- Creation timestamp

**Example:**
```
Order #1
Amount: $25.50
Status: fulfilled
Fulfillment ID: 101
Created: 2/19/2026, 3:45:30 PM
```

---

#### 6. Transaction Ledger
**What it shows:** Complete transaction history

**Features:**
- Shows last 50 transactions
- Click "View Ledger" to load
- Each entry shows:
  - Transaction type (CREDIT or DEBIT)
  - Amount
  - Description
  - Balance after transaction
  - Timestamp

**Transaction Types:**
- 🟢 **CREDIT** - Money added to wallet
- 🔴 **DEBIT** - Money removed from wallet

**Descriptions:**
- "Initial balance" - Starting amount
- "Admin credit" - Admin added funds
- "Admin debit" - Admin removed funds
- "Order payment" - Money deducted for order

**Visual:**
```
┌─────────────────────────────────────────────┐
│ DEBIT: $25.50                    [debit]    │
│ Order payment                               │
│ Balance After: $974.50                      │
│ 2/19/2026, 3:45:30 PM                      │
├─────────────────────────────────────────────┤
│ CREDIT: $150.75                  [credit]   │
│ Admin credit                                │
│ Balance After: $1150.75                     │
│ 2/19/2026, 2:20:10 PM                      │
└─────────────────────────────────────────────┘
```

---

## 🎯 Common Workflows

### Workflow 1: Admin Adds Funds to Client

```
1. Switch to "Admin Panel" tab
2. Credit Wallet section
3. Select client: "John Doe"
4. Enter amount: 500
5. Click "Credit Wallet"
6. ✅ Success! New balance shown
```

---

### Workflow 2: Client Creates Order

```
1. Switch to "Client Panel" tab
2. Select client: "Jane Smith"
3. View current balance: $1000
4. Create Order section
5. Enter amount: 75.50
6. Click "Create Order"
7. ✅ Order created!
   - Wallet: $1000 → $924.50
   - Fulfillment ID: 101
   - Order appears in "My Orders"
   - Transaction in ledger
```

---

### Workflow 3: Check Order Status

```
1. Client Panel → Select client
2. Scroll to "Get Order Details"
3. Enter order ID: 1
4. Click "Get Details"
5. View complete information
```

---

### Workflow 4: View Transaction History

```
1. Client Panel → Select client
2. Scroll to "Transaction Ledger"
3. Click "View Ledger"
4. See all transactions:
   - Credits (green)
   - Debits (red)
   - Balance after each
```

---

## 💡 Tips & Tricks

### ✅ Best Practices

1. **Check Balance First**
   - Always verify balance before creating orders
   - Use "Refresh Balance" if unsure

2. **Monitor Orders**
   - Click "Refresh Orders" after creating new orders
   - Check status badges for fulfillment status

3. **Review Ledger**
   - Use ledger to audit all transactions
   - Each entry shows resulting balance

4. **Admin Operations**
   - Credit wallet before clients need to order
   - Verify client selection before debit

### ⚠️ Error Messages

**"Insufficient balance"**
- Solution: Admin credit wallet or reduce order amount

**"Client not found"**
- Solution: Select a valid client from dropdown

**"Amount must be greater than 0"**
- Solution: Enter a positive amount

**"Network error occurred"**
- Solution: Ensure backend server is running

---

## 🎨 Visual Elements

### Color Coding

- **Purple/Blue Gradients** - Headers and primary buttons
- **Green** - Success messages, credit transactions
- **Red** - Error messages, debit transactions
- **Yellow** - Pending status
- **Gray** - Secondary buttons

### Status Indicators

- 🟢 **Green Badge** - Success/Fulfilled
- 🟡 **Yellow Badge** - Pending/Warning
- 🔴 **Red Badge** - Error/Failed
- 🔵 **Blue Badge** - Info

### Button Types

- **Credit Wallet** - Green button
- **Debit Wallet** - Red button
- **Create Order** - Purple button
- **Refresh/View** - Gray button

---

## 📱 Responsive Design

The interface works on:
- ✅ Desktop computers
- ✅ Laptops
- ✅ Tablets
- ✅ Mobile devices (responsive)

---

## 🔄 Auto-Refresh

These items refresh automatically:
- ✅ Balance after order creation
- ✅ Order list after new order
- ✅ Ledger after transaction

These require manual refresh:
- Balance display ("Refresh Balance" button)
- Order list ("Refresh Orders" button)
- Ledger ("View Ledger" button)

---

## 🎓 FAQ

**Q: Why doesn't my balance update?**
A: Click "Refresh Balance" button to get latest value

**Q: Where do I see fulfillment ID?**
A: In order details or in the "My Orders" list

**Q: Can I cancel an order?**
A: No, orders are final once created (as per requirements)

**Q: What happens if fulfillment API fails?**
A: Order is still created, wallet is still debited, but status shows "fulfillment_failed"

**Q: How do I add a new client?**
A: Currently not supported in UI (would need database access)

**Q: Is there authentication?**
A: No, this is a demo system. Production needs auth.

---

## 📸 Screenshot Guide

### Admin Panel Layout
```
┌────────────────────────────────────────────┐
│  💰 Transaction System                     │
│  Wallet Management & Order Processing      │
├────────────────────────────────────────────┤
│ [Admin Panel] [Client Panel]              │
├────────────────────────────────────────────┤
│                                            │
│  Admin Operations                          │
│                                            │
│  💵 Credit Wallet                          │
│  ┌──────────────────────────────────────┐ │
│  │ Client: [Select client... ▼]         │ │
│  │ Amount: [________]                   │ │
│  │ [Credit Wallet]                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  💸 Debit Wallet                           │
│  ┌──────────────────────────────────────┐ │
│  │ Client: [Select client... ▼]         │ │
│  │ Amount: [________]                   │ │
│  │ [Debit Wallet]                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

### Client Panel Layout
```
┌────────────────────────────────────────────┐
│  💰 Transaction System                     │
│  Wallet Management & Order Processing      │
├────────────────────────────────────────────┤
│ [Admin Panel] [Client Panel]              │
├────────────────────────────────────────────┤
│                                            │
│  Client Operations                         │
│                                            │
│  👤 Select Client                          │
│  [Select client... ▼]                      │
│                                            │
│  💳 Wallet Balance                         │
│  ┌──────────────────────────────────────┐ │
│  │         $1,000.00                    │ │
│  │  [Refresh Balance]                   │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  🛒 Create Order                           │
│  ┌──────────────────────────────────────┐ │
│  │ Order Amount: [________]             │ │
│  │ [Create Order]                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  📦 My Orders                              │
│  [Refresh Orders]                          │
│  [Order list appears here]                 │
│                                            │
└────────────────────────────────────────────┘
```

---

**Ready to use! Open the frontend and start managing transactions!** 🚀
