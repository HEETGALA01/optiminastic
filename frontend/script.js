const API_URL = 'http://localhost:3000';

let currentUser = null;
let currentClientId = null;
let clients = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showMainApp();
  }
});

// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  
  errorDiv.textContent = '';
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      currentUser = data.user;
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      showMainApp();
    } else {
      errorDiv.textContent = '❌ ' + data.error;
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = '❌ Network error. Please try again.';
  }
}

// Handle Logout
function handleLogout() {
  sessionStorage.removeItem('currentUser');
  currentUser = null;
  currentClientId = null;
  location.reload();
}

// Show main application after login
function showMainApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  document.getElementById('username').textContent = currentUser.name;
  
  currentClientId = currentUser.id;
  
  // Show appropriate panel based on user type
  if (currentUser.is_admin) {
    document.getElementById('client-panel').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadClients();
    setupEventListeners();
  } else {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('tabs-container').style.display = 'none';
    document.getElementById('client-panel').style.display = 'block';
    document.getElementById('client-info').style.display = 'block';
    // Hide client selector for regular clients
    document.querySelector('#client-panel .card:first-child').style.display = 'none';
    loadClientData();
    setupEventListeners();
  }
}

function setupEventListeners() {
  // Admin forms
  const creditForm = document.getElementById('credit-form');
  const debitForm = document.getElementById('debit-form');
  if (creditForm) creditForm.addEventListener('submit', handleCreditWallet);
  if (debitForm) debitForm.addEventListener('submit', handleDebitWallet);
  
  // Client forms
  document.getElementById('order-form').addEventListener('submit', handleCreateOrder);
  const orderDetailsForm = document.getElementById('order-details-form');
  if (orderDetailsForm) orderDetailsForm.addEventListener('submit', handleGetOrderDetails);
}

// Tab switching
function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`${tab}-panel`).classList.add('active');
}

// Load clients
async function loadClients() {
  try {
    const response = await fetch(`${API_URL}/clients`);
    const data = await response.json();
    
    if (data.success) {
      clients = data.clients;
      populateClientDropdowns();
      loadClientWallets();
    }
  } catch (error) {
    console.error('Error loading clients:', error);
    showResult('admin-result', 'Error loading clients', 'error');
  }
}

// Load client wallets for admin view
async function loadClientWallets() {
  try {
    const nonAdminClients = clients.filter(c => c.is_admin === 0);
    const walletPromises = nonAdminClients.map(async (client) => {
      const response = await fetch(`${API_URL}/wallet/balance`, {
        headers: { 'client-id': client.id }
      });
      const data = await response.json();
      return {
        ...client,
        balance: data.success ? data.balance : 0
      };
    });
    
    const clientsWithBalances = await Promise.all(walletPromises);
    
    const walletsHtml = clientsWithBalances.map(client => `
      <div class="list-item">
        <div class="list-item-info">
          <div class="list-item-title">${client.name}</div>
          <div class="list-item-detail">${client.email}</div>
        </div>
        <span class="balance-amount" style="font-size: 1.2rem; font-weight: bold; color: #28a745;">$${client.balance.toFixed(2)}</span>
      </div>
    `).join('');
    
    document.getElementById('client-wallets-list').innerHTML = walletsHtml || '<p style="text-align: center; color: #6c757d; padding: 20px;">No clients found</p>';
  } catch (error) {
    console.error('Error loading client wallets:', error);
  }
}

function populateClientDropdowns() {
  const creditSelect = document.getElementById('credit-client');
  const debitSelect = document.getElementById('debit-client');
  const clientSelect = document.getElementById('selected-client');
  
  const nonAdminClients = clients.filter(c => c.is_admin === 0);
  
  // Clear existing options except first
  creditSelect.innerHTML = '<option value="">Select client...</option>';
  debitSelect.innerHTML = '<option value="">Select client...</option>';
  clientSelect.innerHTML = '<option value="">Select client...</option>';
  
  nonAdminClients.forEach(client => {
    const option = `<option value="${client.id}">${client.name} (${client.email})</option>`;
    creditSelect.innerHTML += option;
    debitSelect.innerHTML += option;
    clientSelect.innerHTML += option;
  });
}

// Admin - Credit Wallet
async function handleCreditWallet(e) {
  e.preventDefault();
  
  const clientId = document.getElementById('credit-client').value;
  const amount = parseFloat(document.getElementById('credit-amount').value);
  
  try {
    const response = await fetch(`${API_URL}/admin/wallet/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, amount })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showResult('admin-result', 
        `✅ Successfully credited $${amount.toFixed(2)} to client. New balance: $${data.new_balance.toFixed(2)}`, 
        'success'
      );
      document.getElementById('credit-form').reset();
      loadClientWallets();
    } else {
      showResult('admin-result', `❌ Error: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showResult('admin-result', '❌ Network error occurred', 'error');
  }
}

// Admin - Debit Wallet
async function handleDebitWallet(e) {
  e.preventDefault();
  
  const clientId = document.getElementById('debit-client').value;
  const amount = parseFloat(document.getElementById('debit-amount').value);
  
  try {
    const response = await fetch(`${API_URL}/admin/wallet/debit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, amount })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showResult('admin-result', 
        `✅ Successfully debited $${amount.toFixed(2)} from client. New balance: $${data.new_balance.toFixed(2)}`, 
        'success'
      );
      document.getElementById('debit-form').reset();
      loadClientWallets();
    } else {
      showResult('admin-result', `❌ Error: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showResult('admin-result', '❌ Network error occurred', 'error');
  }
}

// Load client data when selected
function loadClientData() {
  // If called from dropdown, update currentClientId
  const dropdown = document.getElementById('selected-client');
  if (dropdown && dropdown.value) {
    currentClientId = dropdown.value;
  }
  
  // Load data if we have a client ID (from login or dropdown)
  if (currentClientId) {
    document.getElementById('client-info').style.display = 'block';
    refreshBalance();
    loadOrders();
    loadLedger();
  } else {
    document.getElementById('client-info').style.display = 'none';
  }
}

// Refresh wallet balance
async function refreshBalance() {
  if (!currentClientId) return;
  
  try {
    const response = await fetch(`${API_URL}/wallet/balance`, {
      headers: { 'client-id': currentClientId }
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('balance-display').textContent = `$${data.balance.toFixed(2)}`;
    } else {
      showResult('client-result', `❌ Error: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showResult('client-result', '❌ Network error occurred', 'error');
  }
}

// Create order
async function handleCreateOrder(e) {
  e.preventDefault();
  
  const amount = parseFloat(document.getElementById('order-amount').value);
  const note = document.getElementById('order-note').value.trim();
  
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'client-id': currentClientId
      },
      body: JSON.stringify({ amount, note })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const noteText = data.order.note ? `<br>Note: ${data.order.note}` : '';
      showResult('client-result', 
        `✅ Order created successfully!<br>
        Order ID: ${data.order.id}<br>
        Amount: $${data.order.amount.toFixed(2)}<br>
        Status: ${data.order.status}<br>
        Fulfillment ID: ${data.order.fulfillment_id || 'N/A'}<br>
        New Balance: $${data.order.wallet_balance.toFixed(2)}${noteText}`, 
        'success'
      );
      document.getElementById('order-form').reset();
      refreshBalance();
      loadOrders();
      loadLedger();
    } else {
      showResult('client-result', `❌ Error: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showResult('client-result', '❌ Network error occurred', 'error');
  }
}

// Get order details
async function handleGetOrderDetails(e) {
  e.preventDefault();
  
  const orderId = document.getElementById('order-id-input').value;
  
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: { 'client-id': currentClientId }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const order = data.order;
      const detailsHtml = `
        <div class="list-item">
          <div class="list-item-info">
            <div class="list-item-title">Order #${order.id}</div>
            <div class="list-item-detail">Amount: $${order.amount.toFixed(2)}</div>
            <div class="list-item-detail">Status: ${order.status}</div>
            <div class="list-item-detail">Fulfillment ID: ${order.fulfillment_id || 'N/A'}</div>
            <div class="list-item-detail">Created: ${new Date(order.created_at).toLocaleString()}</div>
          </div>
          <span class="list-item-badge ${getBadgeClass(order.status)}">${order.status}</span>
        </div>
      `;
      document.getElementById('order-details').innerHTML = detailsHtml;
      document.getElementById('order-details').classList.add('show');
    } else {
      showResult('client-result', `❌ Error: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showResult('client-result', '❌ Network error occurred', 'error');
  }
}

// Load orders
async function loadOrders() {
  if (!currentClientId) return;
  
  try {
    const response = await fetch(`${API_URL}/client/${currentClientId}/orders`);
    const data = await response.json();
    
    if (data.success) {
      const ordersHtml = data.orders.length > 0 
        ? data.orders.map(order => `
            <div class="list-item">
              ${order.note ? `<div class="list-item-note">📝 ${order.note}</div>` : ''}
              <div class="list-item-info">
                <div class="list-item-title">Order #${order.id}</div>
                <div class="list-item-detail">Amount: $${order.amount.toFixed(2)} | Fulfillment: ${order.fulfillment_id || 'N/A'}</div>
                <div class="list-item-detail">${new Date(order.created_at).toLocaleString()}</div>
              </div>
              <span class="list-item-badge ${getBadgeClass(order.status)}">${order.status}</span>
            </div>
          `).join('')
        : '<p style="text-align: center; color: #6c757d; padding: 20px;">No orders yet</p>';
      
      document.getElementById('orders-list').innerHTML = ordersHtml;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Load ledger
async function loadLedger() {
  if (!currentClientId) return;
  
  try {
    const response = await fetch(`${API_URL}/client/${currentClientId}/ledger`);
    const data = await response.json();
    
    if (data.success) {
      const ledgerHtml = data.entries.length > 0
        ? data.entries.map(entry => `
            <div class="list-item">
              <div class="list-item-info">
                <div class="list-item-title">${entry.transaction_type.toUpperCase()}: $${entry.amount.toFixed(2)}</div>
                <div class="list-item-detail">${entry.description}</div>
                <div class="list-item-detail">Balance After: $${entry.balance_after.toFixed(2)}</div>
                <div class="list-item-detail">${new Date(entry.created_at).toLocaleString()}</div>
              </div>
              <span class="list-item-badge ${entry.transaction_type === 'credit' ? 'badge-success' : 'badge-danger'}">
                ${entry.transaction_type}
              </span>
            </div>
          `).join('')
        : '<p style="text-align: center; color: #6c757d; padding: 20px;">No transactions yet</p>';
      
      document.getElementById('ledger-list').innerHTML = ledgerHtml;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Helper functions
function showResult(elementId, message, type) {
  const resultDiv = document.getElementById(elementId);
  resultDiv.innerHTML = message;
  resultDiv.className = `result show ${type}`;
  
  setTimeout(() => {
    resultDiv.classList.remove('show');
  }, 5000);
}

function getBadgeClass(status) {
  switch (status) {
    case 'fulfilled': return 'badge-success';
    case 'pending': return 'badge-warning';
    case 'fulfillment_failed': return 'badge-danger';
    default: return 'badge-info';
  }
}
