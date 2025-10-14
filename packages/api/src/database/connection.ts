import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/zoneflow.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('foreign_keys = ON');
db.pragma('temp_store = MEMORY');

// Load SpatiaLite extension for geospatial functions
try {
  // Try to load SpatiaLite extension
  // Note: This requires SpatiaLite to be installed on the system
  db.loadExtension('mod_spatialite');
  console.log('✅ SpatiaLite extension loaded successfully');
} catch (error) {
  console.warn('⚠️  SpatiaLite extension not available. Geospatial functions will use JavaScript fallbacks.');
  console.warn('To install SpatiaLite: brew install libspatialite (macOS) or apt-get install libspatialite7 (Ubuntu)');
}

// Initialize spatial metadata (if SpatiaLite is available)
try {
  db.exec('SELECT InitSpatialMetadata(1)');
  console.log('✅ Spatial metadata initialized');
} catch (error) {
  // SpatiaLite not available, continue without spatial functions
}

export default db;