import { generateId, calculateDistance } from '@zoneflow/shared';
import db from '../database/connection.js';
import {
  CreateGeofenceData,
  UpdateGeofenceData,
  GeofenceWithEvents,
  NotFoundError,
  ValidationError,
  ServiceError
} from '../types/services.js';

export class GeofenceService {
  /**
   * Get all geofences for a business with optional type filtering
   */
  static async getGeofences(businessId: string, type?: string): Promise<GeofenceWithEvents[]> {
    try {
      let query = 'SELECT * FROM geofences WHERE business_id = ?';
      const params: any[] = [businessId];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC';

      const geofences = db.prepare(query).all(...params) as GeofenceWithEvents[];

      return geofences.map(g => ({
        ...g,
        is_active: Boolean((g as any).is_active)
      }));
    } catch (error) {
      console.error('Error fetching geofences:', error);
      throw new ServiceError('Failed to fetch geofences');
    }
  }

  /**
   * Get a single geofence by ID with recent events
   */
  static async getGeofenceById(geofenceId: string, businessId: string): Promise<{
    geofence: GeofenceWithEvents;
    events: Array<{
      id: string;
      event_type: string;
      timestamp: string;
      driver_user_id?: string;
      driver_name?: string;
      tracking_code?: string;
    }>;
  }> {
    try {
      const geofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
        .get(geofenceId, businessId) as GeofenceWithEvents | undefined;

      if (!geofence) {
        throw new NotFoundError('Geofence');
      }

      // Get recent events for this geofence
      const events = db.prepare(`
        SELECT ge.*, d.user_id as driver_user_id, u.name as driver_name, o.tracking_code
        FROM geofence_events ge
        LEFT JOIN drivers d ON ge.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN orders o ON ge.order_id = o.id
        WHERE ge.geofence_id = ?
        ORDER BY ge.timestamp DESC
        LIMIT 20
      `).all(geofenceId) as Array<{
        id: string;
        event_type: string;
        timestamp: string;
        driver_user_id?: string;
        driver_name?: string;
        tracking_code?: string;
      }>;

      return { geofence, events };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching geofence:', error);
      throw new ServiceError('Failed to fetch geofence');
    }
  }

  /**
   * Create a new geofence
   */
  static async createGeofence(geofenceData: CreateGeofenceData, businessId: string): Promise<GeofenceWithEvents> {
    try {
      const geofenceId = generateId();

      db.prepare(`
        INSERT INTO geofences (
          id, business_id, name, type, center_latitude, center_longitude, radius, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        geofenceId, businessId, geofenceData.name, geofenceData.type,
        geofenceData.centerLatitude, geofenceData.centerLongitude, geofenceData.radius,
        geofenceData.isActive !== false ? 1 : 0
      );

      const newGeofence = db.prepare('SELECT * FROM geofences WHERE id = ?').get(geofenceId) as GeofenceWithEvents;

      return newGeofence;
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw new ServiceError('Failed to create geofence');
    }
  }

  /**
   * Update an existing geofence
   */
  static async updateGeofence(
    geofenceId: string,
    updateData: UpdateGeofenceData,
    businessId: string
  ): Promise<GeofenceWithEvents> {
    try {
      // Check if geofence exists and belongs to business
      const existingGeofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
        .get(geofenceId, businessId);

      if (!existingGeofence) {
        throw new NotFoundError('Geofence');
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updateData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updateData.name);
      }

      if (updateData.type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(updateData.type);
      }

      if (updateData.centerLatitude !== undefined) {
        updateFields.push('center_latitude = ?');
        updateValues.push(updateData.centerLatitude);
      }

      if (updateData.centerLongitude !== undefined) {
        updateFields.push('center_longitude = ?');
        updateValues.push(updateData.centerLongitude);
      }

      if (updateData.radius !== undefined) {
        updateFields.push('radius = ?');
        updateValues.push(updateData.radius);
      }

      if (updateData.isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(updateData.isActive ? 1 : 0);
      }

      if (updateFields.length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(geofenceId);

      const updateQuery = `UPDATE geofences SET ${updateFields.join(', ')} WHERE id = ?`;
      db.prepare(updateQuery).run(...updateValues);

      const updatedGeofence = db.prepare('SELECT * FROM geofences WHERE id = ?').get(geofenceId) as GeofenceWithEvents;

      return { ...updatedGeofence, is_active: Boolean((updatedGeofence as any).is_active) };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error updating geofence:', error);
      throw new ServiceError('Failed to update geofence');
    }
  }

  /**
   * Delete a geofence
   */
  static async deleteGeofence(geofenceId: string, businessId: string): Promise<void> {
    try {
      // Check if geofence exists and belongs to business
      const existingGeofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
        .get(geofenceId, businessId);

      if (!existingGeofence) {
        throw new NotFoundError('Geofence');
      }

      // Delete the geofence (events will be cascade deleted if foreign key constraints are set)
      const result = db.prepare('DELETE FROM geofences WHERE id = ?').run(geofenceId);

      if (result.changes === 0) {
        throw new ServiceError('Failed to delete geofence');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting geofence:', error);
      throw new ServiceError('Failed to delete geofence');
    }
  }

  /**
   * Toggle geofence active status
   */
  static async toggleGeofenceStatus(geofenceId: string, businessId: string): Promise<GeofenceWithEvents> {
    try {
      // Check if geofence exists and belongs to business
      const existingGeofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
        .get(geofenceId, businessId) as { is_active: number } | undefined;

      if (!existingGeofence) {
        throw new NotFoundError('Geofence');
      }

      const newStatus = existingGeofence.is_active ? 0 : 1;

      db.prepare('UPDATE geofences SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newStatus, geofenceId);

      const updatedGeofence = db.prepare('SELECT * FROM geofences WHERE id = ?').get(geofenceId) as GeofenceWithEvents;

      return { ...updatedGeofence, is_active: Boolean((updatedGeofence as any).is_active) };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error toggling geofence status:', error);
      throw new ServiceError('Failed to toggle geofence status');
    }
  }

  /**
   * Check if a location is within any active geofences for a business
   */
  static async checkGeofenceEntry(
    businessId: string,
    latitude: number,
    longitude: number,
    driverId?: string,
    orderId?: string
  ): Promise<Array<{
    geofence: GeofenceWithEvents;
    distance: number;
    isInside: boolean;
  }>> {
    try {
      // Get all active geofences for the business
      const geofences = db.prepare(`
        SELECT * FROM geofences 
        WHERE business_id = ? AND is_active = 1
      `).all(businessId) as GeofenceWithEvents[];

      const results = [] as Array<{ geofence: GeofenceWithEvents; distance: number; isInside: boolean }>;

      for (const geofence of geofences) {
        const distance = calculateDistance(
          latitude,
          longitude,
          geofence.center_latitude,
          geofence.center_longitude
        );

        const isInside = distance <= geofence.radius;

        results.push({
          geofence: { ...geofence, is_active: Boolean((geofence as any).is_active) },
          distance,
          isInside,
        });

        // If inside a geofence, log the event
        if (isInside && driverId) {
          try {
            const eventId = generateId();
            db.prepare(`
              INSERT INTO geofence_events (
                id, geofence_id, driver_id, order_id, event_type, timestamp
              ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              eventId,
              geofence.id,
              driverId,
              orderId || null,
              'entry',
              new Date().toISOString()
            );
          } catch (eventError) {
            console.error('Error logging geofence event:', eventError);
            // Don't throw here, just log the error
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error checking geofence entry:', error);
      throw new ServiceError('Failed to check geofence entry');
    }
  }
}