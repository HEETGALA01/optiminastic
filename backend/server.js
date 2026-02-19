const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Utility function to run database queries as promises
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ========== ADMIN ENDPOINTS ==========

// 1. Admin - Credit Wallet
app.post('/admin/wallet/credit', async (req, res) => {
  try {
    const { client_id, amount } = req.body;

    if (!client_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid client_id or amount' });
    }

    // Start transaction by getting current balance
    const wallet = await dbGet('SELECT * FROM wallets WHERE client_id = ?', [client_id]);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const newBalance = wallet.balance + amount;

    // Update wallet balance
    await dbRun('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?', 
      [newBalance, client_id]);

    // Create ledger entry
    await dbRun(
      'INSERT INTO ledger_entries (client_id, transaction_type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
      [client_id, 'credit', amount, newBalance, 'Admin credit']
    );

    res.json({
      success: true,
      message: 'Wallet credited successfully',
      client_id,
      amount,
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Error crediting wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Admin - Debit Wallet
app.post('/admin/wallet/debit', async (req, res) => {
  try {
    const { client_id, amount } = req.body;

    if (!client_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid client_id or amount' });
    }

    // Get current balance
    const wallet = await dbGet('SELECT * FROM wallets WHERE client_id = ?', [client_id]);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance = wallet.balance - amount;

    // Update wallet balance
    await dbRun('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?', 
      [newBalance, client_id]);

    // Create ledger entry
    await dbRun(
      'INSERT INTO ledger_entries (client_id, transaction_type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
      [client_id, 'debit', amount, newBalance, 'Admin debit']
    );

    res.json({
      success: true,
      message: 'Wallet debited successfully',
      client_id,
      amount,
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Error debiting wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== CLIENT ENDPOINTS ==========

// 3. Client - Create Order
app.post('/orders', async (req, res) => {
  try {
    const clientId = req.headers['client-id'];
    const { amount, note } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'client-id header is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate client exists
    const client = await dbGet('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get wallet balance
    const wallet = await dbGet('SELECT * FROM wallets WHERE client_id = ?', [clientId]);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    const newBalance = wallet.balance - amount;

    // Deduct amount from wallet atomically
    await dbRun('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?', 
      [newBalance, clientId]);

    // Create ledger entry with note
    const ledgerDescription = note ? `Order payment - ${note}` : 'Order payment';
    await dbRun(
      'INSERT INTO ledger_entries (client_id, transaction_type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
      [clientId, 'debit', amount, newBalance, ledgerDescription]
    );

    // Create order with note
    const orderResult = await dbRun(
      'INSERT INTO orders (client_id, amount, note, status) VALUES (?, ?, ?, ?)',
      [clientId, amount, note || null, 'pending']
    );

    const orderId = orderResult.lastID;

    // Call fulfillment API
    let fulfillmentId = null;
    try {
      const fulfillmentResponse = await axios.post('https://jsonplaceholder.typicode.com/posts', {
        userId: clientId,
        title: orderId.toString()
      });

      fulfillmentId = fulfillmentResponse.data.id;

      // Update order with fulfillment ID
      await dbRun(
        'UPDATE orders SET fulfillment_id = ?, status = ? WHERE id = ?',
        [fulfillmentId, 'fulfilled', orderId]
      );
    } catch (fulfillmentError) {
      console.error('Fulfillment API error:', fulfillmentError.message);
      // Order is created but fulfillment failed
      await dbRun('UPDATE orders SET status = ? WHERE id = ?', ['fulfillment_failed', orderId]);
    }

    res.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: orderId,
        client_id: clientId,
        note: note || null,
        amount,
        status: fulfillmentId ? 'fulfilled' : 'fulfillment_failed',
        fulfillment_id: fulfillmentId,
        wallet_balance: newBalance
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Client - Get Order Details
app.get('/orders/:order_id', async (req, res) => {
  try {
    const clientId = req.headers['client-id'];
    const { order_id } = req.params;

    if (!clientId) {
      return res.status(400).json({ error: 'client-id header is required' });
    }

    // Get order
    const order = await dbGet(
      'SELECT * FROM orders WHERE id = ? AND client_id = ?',
      [order_id, clientId]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        client_id: order.client_id,
        note: order.note,
        amount: order.amount,
        status: order.status,
        fulfillment_id: order.fulfillment_id,
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Wallet Balance
app.get('/wallet/balance', async (req, res) => {
  try {
    const clientId = req.headers['client-id'];

    if (!clientId) {
      return res.status(400).json({ error: 'client-id header is required' });
    }

    // Get wallet
    const wallet = await dbGet('SELECT * FROM wallets WHERE client_id = ?', [clientId]);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      success: true,
      client_id: clientId,
      balance: wallet.balance,
      updated_at: wallet.updated_at
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== HELPER ENDPOINTS ==========

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const client = await dbGet('SELECT id, name, email, is_admin FROM clients WHERE email = ? AND password = ?', [email, password]);
    
    if (!client) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        is_admin: client.is_admin
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all clients (for frontend dropdown) - requires authentication
app.get('/clients', async (req, res) => {
  try {
    const clients = await dbAll('SELECT id, name, email, is_admin FROM clients');
    res.json({ success: true, clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client orders
app.get('/client/:client_id/orders', async (req, res) => {
  try {
    const { client_id } = req.params;
    const orders = await dbAll(
      'SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC',
      [client_id]
    );
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client ledger entries
app.get('/client/:client_id/ledger', async (req, res) => {
  try {
    const { client_id } = req.params;
    const entries = await dbAll(
      'SELECT * FROM ledger_entries WHERE client_id = ? ORDER BY created_at DESC LIMIT 50',
      [client_id]
    );
    res.json({ success: true, entries });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Transaction system is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Transaction System Backend running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST   /auth/login`);
  console.log(`   POST   /admin/wallet/credit`);
  console.log(`   POST   /admin/wallet/debit`);
  console.log(`   POST   /orders`);
  console.log(`   GET    /orders/:order_id`);
  console.log(`   GET    /wallet/balance`);
  console.log(`   GET    /clients`);
  console.log(`   GET    /client/:client_id/orders`);
  console.log(`   GET    /client/:client_id/ledger`);
  console.log(`\n🔐 Login Credentials:`);
  console.log(`   Admin: admin@example.com / admin123`);
  console.log(`   Khushi: khushi@example.com / khushi123`);
  console.log(`   Pareen: pareen@example.com / pareen123`);
  console.log(`   Heet: heet@example.com / heet123`);
  console.log(`   Tirth: tirth@example.com / tirth123`);
  console.log(`\n`);
});
