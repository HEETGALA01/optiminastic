const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'transaction.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Clients table with password
    db.run(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Wallets table
    db.run(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER UNIQUE NOT NULL,
        balance REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // Ledger entries table
    db.run(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // Orders table with note field
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        status TEXT DEFAULT 'pending',
        fulfillment_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `, () => {
      // Initialize sample data
      initializeSampleData();
    });
  });
}

function initializeSampleData() {
  // Check if sample data exists
  db.get('SELECT COUNT(*) as count FROM clients', [], (err, row) => {
    if (err) {
      console.error('Error checking clients:', err);
      return;
    }

    if (row.count === 0) {
      console.log('Initializing sample data...');
      
      // Insert admin user
      db.run(`
        INSERT INTO clients (name, email, password, is_admin) 
        VALUES ('Admin User', 'admin@example.com', 'admin123', 1)
      `, function(err) {
        if (err) return console.error('Error creating admin:', err);
        const adminId = this.lastID;
        db.run('INSERT INTO wallets (client_id, balance) VALUES (?, 5000)', [adminId]);
        db.run(
          'INSERT INTO ledger_entries (client_id, transaction_type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
          [adminId, 'credit', 5000, 5000, 'Initial balance']
        );
      });

      // Insert sample clients (Khushi, Pareen, Heet, Tirth)
      const clients = [
        { name: 'Khushi', email: 'khushi@example.com', password: 'khushi123' },
        { name: 'Pareen', email: 'pareen@example.com', password: 'pareen123' },
        { name: 'Heet', email: 'heet@example.com', password: 'heet123' },
        { name: 'Tirth', email: 'tirth@example.com', password: 'tirth123' }
      ];

      clients.forEach(client => {
        db.run(
          'INSERT INTO clients (name, email, password, is_admin) VALUES (?, ?, ?, 0)',
          [client.name, client.email, client.password],
          function(err) {
            if (err) return console.error('Error creating client:', err);
            const clientId = this.lastID;
            // Initialize wallet with 1000 balance for demo
            db.run('INSERT INTO wallets (client_id, balance) VALUES (?, ?)', [clientId, 1000]);
            db.run(
              'INSERT INTO ledger_entries (client_id, transaction_type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
              [clientId, 'credit', 1000, 1000, 'Initial balance']
            );
          }
        );
      });

      console.log('Sample data initialized with Khushi, Pareen, Heet, and Tirth');
    }
  });
}

module.exports = db;
