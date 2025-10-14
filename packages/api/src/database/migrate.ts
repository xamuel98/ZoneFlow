#!/usr/bin/env tsx

import { createTables } from './schema.js';

console.log('🔄 Running database migrations...');

try {
  createTables();
  console.log('✅ Database migration completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Database migration failed:', error);
  process.exit(1);
}