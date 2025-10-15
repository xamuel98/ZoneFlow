import db from './connection.js';

export const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'business_owner', 'driver')),
      business_id TEXT,
      phone TEXT,
      is_active BOOLEAN DEFAULT 1,
      is_invited BOOLEAN DEFAULT 0,
      invite_token_hash TEXT,
      invite_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Backfill invite columns for existing databases
  try {
    const columns = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
    const names = new Set(columns.map(c => c.name));
    if (!names.has('is_invited')) {
      db.exec(`ALTER TABLE users ADD COLUMN is_invited BOOLEAN DEFAULT 0`);
    }
    if (!names.has('invite_token_hash')) {
      db.exec(`ALTER TABLE users ADD COLUMN invite_token_hash TEXT`);
    }
    if (!names.has('invite_expires_at')) {
      db.exec(`ALTER TABLE users ADD COLUMN invite_expires_at DATETIME`);
    }
  } catch (e) {
    console.warn('Could not ensure invite columns on users table:', e);
  }

  // Businesses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      owner_id TEXT NOT NULL,
      settings TEXT, -- JSON string for business settings
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // Drivers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      vehicle_type TEXT,
      license_plate TEXT,
      is_available BOOLEAN DEFAULT 1,
      current_latitude REAL,
      current_longitude REAL,
      last_location_update DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tracking_code TEXT UNIQUE NOT NULL,
      business_id TEXT NOT NULL,
      driver_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_email TEXT,
      pickup_address TEXT NOT NULL,
      pickup_latitude REAL NOT NULL,
      pickup_longitude REAL NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_latitude REAL NOT NULL,
      delivery_longitude REAL NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
      priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      estimated_delivery DATETIME,
      actual_pickup DATETIME,
      actual_delivery DATETIME,
      notes TEXT,
      metadata TEXT, -- JSON string for additional order data
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    )
  `);

  // Geofences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS geofences (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('pickup', 'delivery', 'restricted', 'custom')),
      center_latitude REAL NOT NULL,
      center_longitude REAL NOT NULL,
      radius REAL NOT NULL, -- in meters
      is_active BOOLEAN DEFAULT 1,
      metadata TEXT, -- JSON string for additional geofence data
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )
  `);

  // Location history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS location_history (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL,
      order_id TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      heading REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  // Geofence events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS geofence_events (
      id TEXT PRIMARY KEY,
      geofence_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      order_id TEXT,
      event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (geofence_id) REFERENCES geofences(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  // Webhooks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL, -- JSON array of event types
      secret TEXT,
      is_active BOOLEAN DEFAULT 1,
      last_triggered DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
    CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
    CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);
    CREATE INDEX IF NOT EXISTS idx_drivers_business_id ON drivers(business_id);
    CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
    CREATE INDEX IF NOT EXISTS idx_geofences_business_id ON geofences(business_id);
    CREATE INDEX IF NOT EXISTS idx_location_history_driver_id ON location_history(driver_id);
    CREATE INDEX IF NOT EXISTS idx_location_history_order_id ON location_history(order_id);
    CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON location_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence_id ON geofence_events(geofence_id);
    CREATE INDEX IF NOT EXISTS idx_geofence_events_driver_id ON geofence_events(driver_id);
    CREATE INDEX IF NOT EXISTS idx_geofence_events_timestamp ON geofence_events(timestamp);
  `);

  console.log('✅ Database tables created successfully');
};

export const dropTables = () => {
  const tables = [
    'geofence_events',
    'location_history', 
    'webhooks',
    'geofences',
    'orders',
    'drivers',
    'businesses',
    'users'
  ];

  tables.forEach(table => {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  });

  console.log('✅ Database tables dropped successfully');
};