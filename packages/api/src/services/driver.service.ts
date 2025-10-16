import { generateId } from '@zoneflow/shared';
import bcrypt from 'bcryptjs';
import db from '../database/connection.js';
import {
  CreateDriverData,
  BulkCreateDriverData,
  DriverImportResult,
  DriverWithUser,
  PaginationResult,
  Pagination,
  NotFoundError,
  ValidationError,
  ServiceError,
  ConflictError
} from '../types/services.js';
import { AuthService } from './auth.service.js';
import { EmailService } from './email.service.js';

export class DriverService {
  /**
   * Create a single driver
   */
  static async createDriver(
    businessId: string,
    driverData: CreateDriverData
  ): Promise<DriverWithUser> {
    try {
      // Check if email already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(driverData.email);
      if (existingUser) {
        throw new ConflictError('Email already exists');
      }

      // Generate IDs
      const userId = generateId();
      const driverId = generateId();
      
      // Hash password (use default if not provided)
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      const password = driverData.password || process.env.DEFAULT_DRIVER_PASSWORD || 'driver123';
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Start transaction
      const transaction = db.transaction(() => {
        // Create user record
        db.prepare(`
          INSERT INTO users (id, email, password_hash, name, role, business_id, phone, is_active)
          VALUES (?, ?, ?, ?, 'driver', ?, ?, 1)
        `).run(userId, driverData.email, passwordHash, driverData.name, businessId, driverData.phone);

        // Create driver record
        db.prepare(`
          INSERT INTO drivers (id, user_id, business_id, vehicle_type, license_plate, is_available)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          driverId,
          userId,
          businessId,
          driverData.vehicleType || null,
          driverData.licensePlate || null,
          driverData.isAvailable !== false ? 1 : 0
        );
      });

      transaction();

      // Mark user invited and generate invite token
      db.prepare('UPDATE users SET is_invited = 1 WHERE id = ?').run(userId);
      const inviteToken = AuthService.createInviteToken({ userId, email: driverData.email, businessId });
      const inviteBaseUrl = process.env.INVITE_URL_BASE || 'https://app.zoneflow.app/accept-invite';
      const inviteUrl = `${inviteBaseUrl}?token=${encodeURIComponent(inviteToken)}`;
      // Fire-and-forget email; log on failure
      EmailService.sendDriverInvite(driverData.email, driverData.name, inviteUrl).catch((e) => {
        console.error('Failed to send driver invite:', e);
      });

      // Return the created driver with user info
      const driver = db.prepare(`
        SELECT 
          d.id, d.user_id, d.business_id, d.vehicle_type, d.license_plate, 
          d.is_available, d.current_latitude, d.current_longitude, 
          d.last_location_update, d.created_at, d.updated_at,
          u.name, u.email, u.phone, u.role
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
      `).get(driverId) as DriverWithUser;

      return driver;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      console.error('Create driver error:', error);
      throw new ServiceError('Failed to create driver');
    }
  }

  /**
   * Create multiple drivers in bulk
   */
  static async createDriversBulk(
    businessId: string,
    bulkData: BulkCreateDriverData
  ): Promise<DriverImportResult> {
    const result: DriverImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      successfulDrivers: []
    };

    // Start transaction for all operations
    const transaction = db.transaction(() => {
      for (let i = 0; i < bulkData.drivers.length; i++) {
        const driverData = bulkData.drivers[i];
        try {
          // Check if email already exists
          const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(driverData.email);
          if (existingUser) {
            throw new Error('Email already exists');
          }

          // Generate IDs
          const userId = generateId();
          const driverId = generateId();
          
          // Hash password (use default if not provided)
          const password = driverData.password || 'driver123';
          const passwordHash = bcrypt.hashSync(password, 10);

          // Create user record
          db.prepare(`
            INSERT INTO users (id, email, password_hash, name, role, business_id, phone, is_active)
            VALUES (?, ?, ?, ?, 'driver', ?, ?, 1)
          `).run(userId, driverData.email, passwordHash, driverData.name, businessId, driverData.phone);

          // Create driver record
          db.prepare(`
            INSERT INTO drivers (id, user_id, business_id, vehicle_type, license_plate, is_available)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            driverId,
            userId,
            businessId,
            driverData.vehicleType || null,
            driverData.licensePlate || null,
            driverData.isAvailable !== false ? 1 : 0
          );

          // Mark invited
          db.prepare('UPDATE users SET is_invited = 1 WHERE id = ?').run(userId);

          const inviteToken = AuthService.createInviteToken({ userId, email: driverData.email, businessId });
          const inviteBaseUrl = process.env.INVITE_URL_BASE || 'https://app.zoneflow.app/accept-invite';
          const inviteUrl = `${inviteBaseUrl}?token=${encodeURIComponent(inviteToken)}`;
          EmailService.sendDriverInvite(driverData.email, driverData.name, inviteUrl).catch(() => {});

          result.success++;
          result.successfulDrivers.push({
            id: driverId,
            name: driverData.name,
            email: driverData.email
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            data: driverData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    try {
      transaction();
      return result;
    } catch (error) {
      console.error('Bulk create drivers error:', error);
      throw new ServiceError('Failed to create drivers in bulk');
    }
  }

  /**
   * Get all drivers for a business
   */
  static async getDrivers(
    businessId: string,
    pagination: Pagination
  ): Promise<PaginationResult<DriverWithUser>> {
    try {
      const { limit, offset } = pagination;

      // Get drivers with pagination
      const drivers = db.prepare(`
        SELECT 
          d.id, d.user_id, d.business_id, d.vehicle_type, d.license_plate, 
          d.is_available, d.current_latitude, d.current_longitude, 
          d.last_location_update, d.created_at, d.updated_at,
          u.name, u.email, u.phone, u.role
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.business_id = ?
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
          `).all(businessId, limit, offset) as DriverWithUser[];

      // Coerce booleans
      const driversCoerced = drivers.map((d) => ({
        ...d,
        is_available: Boolean(d.is_available),
      }));

      // Get total count
      const { total } = db.prepare('SELECT COUNT(*) as total FROM drivers WHERE business_id = ?')
        .get(businessId) as { total: number };

      return {
        data: driversCoerced,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      console.error('Get drivers error:', error);
      throw new ServiceError('Failed to fetch drivers');
    }
  }

  /**
   * Get a single driver by ID
   */
  static async getDriverById(driverId: string, businessId: string): Promise<DriverWithUser> {
    try {
      const driver = db.prepare(`
        SELECT 
          d.id, d.user_id, d.business_id, d.vehicle_type, d.license_plate, 
          d.is_available, d.current_latitude, d.current_longitude, 
          d.last_location_update, d.created_at, d.updated_at,
          u.name, u.email, u.phone, u.role
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ? AND d.business_id = ?
      `).get(driverId, businessId) as DriverWithUser | undefined;

      if (!driver) {
        throw new NotFoundError('Driver');
      }

      return driver ? { ...driver, is_available: Boolean(driver.is_available) } : driver as any;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Get driver by ID error:', error);
      throw new ServiceError('Failed to fetch driver');
    }
  }

  /**
   * Update driver information
   */
  static async updateDriver(
    driverId: string,
    businessId: string,
    updateData: Partial<CreateDriverData>
  ): Promise<DriverWithUser> {
    try {
      // Check if driver exists
      const existingDriver = await this.getDriverById(driverId, businessId);

      // Start transaction
      const transaction = db.transaction(() => {
        // Update user information if provided
        if (updateData.name || updateData.email || updateData.phone) {
          const userUpdates: string[] = [];
          const userParams: any[] = [];

          if (updateData.name) {
            userUpdates.push('name = ?');
            userParams.push(updateData.name);
          }
          if (updateData.email) {
            // Check if email already exists for another user
            const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
              .get(updateData.email, existingDriver.user_id);
            if (existingUser) {
              throw new ConflictError('Email already exists');
            }
            userUpdates.push('email = ?');
            userParams.push(updateData.email);
          }
          if (updateData.phone) {
            userUpdates.push('phone = ?');
            userParams.push(updateData.phone);
          }

          if (userUpdates.length > 0) {
            userUpdates.push('updated_at = CURRENT_TIMESTAMP');
            userParams.push(existingDriver.user_id);
            
            db.prepare(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`)
              .run(...userParams);
          }
        }

        // Update driver information if provided
        if (updateData.vehicleType !== undefined || updateData.licensePlate !== undefined || updateData.isAvailable !== undefined) {
          const driverUpdates: string[] = [];
          const driverParams: any[] = [];

          if (updateData.vehicleType !== undefined) {
            driverUpdates.push('vehicle_type = ?');
            driverParams.push(updateData.vehicleType);
          }
          if (updateData.licensePlate !== undefined) {
            driverUpdates.push('license_plate = ?');
            driverParams.push(updateData.licensePlate);
          }
          if (updateData.isAvailable !== undefined) {
            driverUpdates.push('is_available = ?');
            driverParams.push(updateData.isAvailable ? 1 : 0);
          }

          if (driverUpdates.length > 0) {
            driverUpdates.push('updated_at = CURRENT_TIMESTAMP');
            driverParams.push(driverId);
            
            db.prepare(`UPDATE drivers SET ${driverUpdates.join(', ')} WHERE id = ?`)
              .run(...driverParams);
          }
        }
      });

      transaction();

      // Return updated driver
      return await this.getDriverById(driverId, businessId);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      console.error('Update driver error:', error);
      throw new ServiceError('Failed to update driver');
    }
  }

  /**
   * Delete a driver
   */
  static async deleteDriver(driverId: string, businessId: string): Promise<void> {
    try {
      // Check if driver exists and belongs to business
      const driver = db.prepare(`
        SELECT d.id, d.user_id 
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ? AND u.business_id = ?
      `).get(driverId, businessId) as { id: string; user_id: string } | undefined;

      if (!driver) {
        throw new NotFoundError('Driver not found');
      }

      // Start transaction to delete both driver and user records
      const transaction = db.transaction(() => {
        // Delete driver record
        db.prepare('DELETE FROM drivers WHERE id = ?').run(driverId);
        
        // Delete user record
        db.prepare('DELETE FROM users WHERE id = ?').run(driver.user_id);
      });

      transaction();
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      console.error('Error deleting driver:', error);
      throw new ServiceError('Failed to delete driver');
    }
  }

  /**
   * Get driver statistics for a business
   */
  static async getDriverStats(businessId: string): Promise<{
    total: number;
    active: number;
    available: number;
    busy: number;
  }> {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN u.is_active = 1 THEN 1 END) as active,
          COUNT(CASE WHEN d.is_available = 1 THEN 1 END) as available,
          COUNT(CASE WHEN d.is_available = 0 AND u.is_active = 1 THEN 1 END) as busy
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE u.business_id = ?
      `).get(businessId) as any;

      return {
        total: stats.total || 0,
        active: stats.active || 0,
        available: stats.available || 0,
        busy: stats.busy || 0
      };
    } catch (error) {
      console.error('Error getting driver stats:', error);
      throw new ServiceError('Failed to get driver statistics');
    }
  }
}