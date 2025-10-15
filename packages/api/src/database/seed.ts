#!/usr/bin/env tsx

import bcrypt from 'bcryptjs';
import { generateId, generateTrackingCode } from '@zoneflow/shared';
import db from './connection.js';
import { AuthService } from '../services/auth.service.js';

const seedData = async () => {
  console.log('🌱 Seeding database with sample data...');

  try {
    // Create admin user
    const adminId = generateId();
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, 'admin@zoneflow.com', adminPasswordHash, 'Admin User', 'admin', 1);

    // Create business owner
    const businessOwnerId = generateId();
    const businessOwnerPasswordHash = await bcrypt.hash('owner123', saltRounds);
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(businessOwnerId, 'owner@example.com', businessOwnerPasswordHash, 'John Smith', 'business_owner', '+1234567890', 1);

    // Create business
    const businessId = generateId();
    db.prepare(`
      INSERT INTO businesses (id, name, address, phone, email, owner_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(businessId, 'QuickDelivery Co.', '123 Main St, City, State 12345', '+1234567890', 'owner@example.com', businessOwnerId);

    // Update business owner with business_id
    db.prepare('UPDATE users SET business_id = ? WHERE id = ?').run(businessId, businessOwnerId);

    // Create drivers
    const driver1Id = generateId();
    const driver1UserId = generateId();
    // Seed driver 1 as invited (no known password); generate placeholder hash
    const driver1PasswordHash = await bcrypt.hash(generateId(), saltRounds);
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, business_id, phone, is_active, is_invited)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(driver1UserId, 'driver1@example.com', driver1PasswordHash, 'Mike Johnson', 'driver', businessId, '+1234567891', 1, 1);

    db.prepare(`
      INSERT INTO drivers (id, user_id, business_id, vehicle_type, license_plate, is_available, current_latitude, current_longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(driver1Id, driver1UserId, businessId, 'Van', 'ABC-123', 1, 40.7128, -74.0060);

    const driver2Id = generateId();
    const driver2UserId = generateId();
    const driver2PasswordHash = await bcrypt.hash(generateId(), saltRounds);
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, business_id, phone, is_active, is_invited)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(driver2UserId, 'driver2@example.com', driver2PasswordHash, 'Sarah Wilson', 'driver', businessId, '+1234567892', 1, 1);

    db.prepare(`
      INSERT INTO drivers (id, user_id, business_id, vehicle_type, license_plate, is_available, current_latitude, current_longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(driver2Id, driver2UserId, businessId, 'Motorcycle', 'XYZ-789', 1, 40.7589, -73.9851);

    // Create sample geofences
    const geofence1Id = generateId();
    db.prepare(`
      INSERT INTO geofences (id, business_id, name, type, center_latitude, center_longitude, radius, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(geofence1Id, businessId, 'Downtown Pickup Zone', 'pickup', 40.7128, -74.0060, 500, 1);

    const geofence2Id = generateId();
    db.prepare(`
      INSERT INTO geofences (id, business_id, name, type, center_latitude, center_longitude, radius, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(geofence2Id, businessId, 'Airport Delivery Zone', 'delivery', 40.6413, -73.7781, 1000, 1);

    const geofence3Id = generateId();
    db.prepare(`
      INSERT INTO geofences (id, business_id, name, type, center_latitude, center_longitude, radius, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(geofence3Id, businessId, 'Restricted Area', 'restricted', 40.7505, -73.9934, 300, 1);

    // Create sample orders
    const order1Id = generateId();
    const tracking1 = generateTrackingCode();
    db.prepare(`
      INSERT INTO orders (
        id, tracking_code, business_id, driver_id, customer_name, customer_phone, customer_email,
        pickup_address, pickup_latitude, pickup_longitude,
        delivery_address, delivery_latitude, delivery_longitude,
        status, priority, estimated_delivery, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order1Id, tracking1, businessId, driver1Id, 'Alice Cooper', '+1555123456', 'alice@example.com',
      '123 Pickup St, New York, NY', 40.7128, -74.0060,
      '456 Delivery Ave, New York, NY', 40.7589, -73.9851,
      'in_transit', 'high', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), 'Handle with care'
    );

    const order2Id = generateId();
    const tracking2 = generateTrackingCode();
    db.prepare(`
      INSERT INTO orders (
        id, tracking_code, business_id, customer_name, customer_phone,
        pickup_address, pickup_latitude, pickup_longitude,
        delivery_address, delivery_latitude, delivery_longitude,
        status, priority, estimated_delivery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order2Id, tracking2, businessId, 'Bob Smith', '+1555654321',
      '789 Start Rd, New York, NY', 40.7505, -73.9934,
      '321 End St, New York, NY', 40.6892, -74.0445,
      'pending', 'medium', new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    );

    const order3Id = generateId();
    const tracking3 = generateTrackingCode();
    db.prepare(`
      INSERT INTO orders (
        id, tracking_code, business_id, driver_id, customer_name, customer_email,
        pickup_address, pickup_latitude, pickup_longitude,
        delivery_address, delivery_latitude, delivery_longitude,
        status, priority, estimated_delivery, actual_pickup, actual_delivery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order3Id, tracking3, businessId, driver2Id, 'Carol Johnson', 'carol@example.com',
      '555 Origin Blvd, New York, NY', 40.6892, -74.0445,
      '777 Destination Dr, New York, NY', 40.7831, -73.9712,
      'delivered', 'low', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 30 * 60 * 1000).toISOString()
    );

    // Create sample location history
    const locations = [
      { lat: 40.7128, lng: -74.0060 },
      { lat: 40.7200, lng: -74.0000 },
      { lat: 40.7300, lng: -73.9900 },
      { lat: 40.7400, lng: -73.9850 },
      { lat: 40.7589, lng: -73.9851 },
    ];

    for (let i = 0; i < locations.length; i++) {
      const historyId = generateId();
      const timestamp = new Date(Date.now() - (locations.length - i) * 10 * 60 * 1000).toISOString();
      
      db.prepare(`
        INSERT INTO location_history (id, driver_id, order_id, latitude, longitude, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(historyId, driver1Id, order1Id, locations[i].lat, locations[i].lng, timestamp);
    }

    // Create sample geofence events
    const event1Id = generateId();
    db.prepare(`
      INSERT INTO geofence_events (id, geofence_id, driver_id, order_id, event_type, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(event1Id, geofence1Id, driver1Id, order1Id, 'enter', 40.7128, -74.0060);

    const event2Id = generateId();
    db.prepare(`
      INSERT INTO geofence_events (id, geofence_id, driver_id, order_id, event_type, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(event2Id, geofence1Id, driver1Id, order1Id, 'exit', 40.7150, -74.0040);

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample accounts created:');
    console.log('Admin: admin@zoneflow.com / admin123');
    console.log('Business Owner: owner@example.com / owner123');
    try {
      const base = process.env.INVITE_URL_BASE || 'https://app.zoneflow.app/accept-invite';
      const invite1 = AuthService.createInviteToken({ userId: driver1UserId, email: 'driver1@example.com', businessId });
      const invite2 = AuthService.createInviteToken({ userId: driver2UserId, email: 'driver2@example.com', businessId });
      console.log(`Driver 1 invite: ${base}?token=${encodeURIComponent(invite1)}`);
      console.log(`Driver 2 invite: ${base}?token=${encodeURIComponent(invite2)}`);
    } catch {
      console.log('Set JWT_SECRET to generate invite URLs for drivers.');
    }
    console.log('\n📦 Sample data:');
    console.log('- 3 orders (1 in transit, 1 pending, 1 delivered)');
    console.log('- 2 drivers with locations');
    console.log('- 3 geofences');
    console.log('- Location history and geofence events');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedData;