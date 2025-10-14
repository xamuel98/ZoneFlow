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
let spatialiteLoaded = false;

// Try multiple possible SpatiaLite extension paths
const spatialitePaths = [
  // Homebrew paths (Apple Silicon)
  '/opt/homebrew/opt/libspatialite/lib/mod_spatialite',
  '/opt/homebrew/lib/mod_spatialite',
  // Homebrew paths (Intel)
  '/usr/local/opt/libspatialite/lib/mod_spatialite',
  '/usr/local/lib/mod_spatialite',
  // System paths
  'mod_spatialite',
  'libspatialite'
];

for (const spatialitePath of spatialitePaths) {
  try {
    console.log(`🔍 Trying to load SpatiaLite from: ${spatialitePath}`);
    db.loadExtension(spatialitePath);
    console.log(`✅ SpatiaLite extension loaded successfully from: ${spatialitePath}`);
    spatialiteLoaded = true;
    break;
  } catch (error) {
    console.log(`❌ Failed to load from ${spatialitePath}: ${(error as Error).message}`);
  }
}

if (!spatialiteLoaded) {
  console.warn('⚠️  SpatiaLite extension not available. Geospatial functions will use JavaScript fallbacks.');
  console.warn('To install SpatiaLite: brew install libspatialite (macOS) or apt-get install libspatialite7 (Ubuntu)');
  console.warn('Tried paths:', spatialitePaths.join(', '));
}

// Initialize spatial metadata (if SpatiaLite is available)
if (spatialiteLoaded) {
  try {
    db.exec('SELECT InitSpatialMetadata(1)');
    console.log('✅ Spatial metadata initialized');
  } catch (error) {
    console.log('ℹ️  Spatial metadata already initialized or not needed');
  }
} else {
  console.log('ℹ️  Skipping spatial metadata initialization (SpatiaLite not loaded)');
}

export default db;