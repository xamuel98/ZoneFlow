import { generateId } from '@zoneflow/shared';
import bcrypt from 'bcryptjs';
import db from '../database/connection.js';
import { AuthService } from './auth.service.js';
import { EmailService } from './email.service.js';
import {
  ServiceError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../types/services.js';

export interface DriverInvitationData {
  email: string;
  name: string;
  phone?: string;
  vehicleType?: string;
  licensePlate?: string;
  expiresInDays?: number;
  message?: string;
}

export interface DriverInvitation {
  id: string;
  business_id: string;
  email: string;
  name: string;
  phone?: string;
  vehicle_type?: string;
  license_plate?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  token: string;
  expires_at: string;
  invited_by: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  invited_by_name?: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  cancelled: number;
  expired: number;
}

export interface PaginatedInvitations {
  invitations: DriverInvitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class DriverInvitationService {
  /**
   * Create a new driver invitation
   */
  static async createInvitation(
    businessId: string,
    invitedBy: string,
    invitationData: DriverInvitationData
  ): Promise<DriverInvitation> {
    try {
      // Check if email already exists as a user
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(invitationData.email);
      if (existingUser) {
        throw new ConflictError('A user with this email already exists');
      }

      // Check if there's already a pending invitation for this email
      const existingInvitation = db.prepare(
        'SELECT id FROM driver_invitations WHERE email = ? AND business_id = ? AND status = ?'
      ).get(invitationData.email, businessId, 'pending');
      
      if (existingInvitation) {
        throw new ConflictError('A pending invitation already exists for this email');
      }

      const invitationId = generateId();
      const token = AuthService.createInviteToken({
        userId: invitationId,
        email: invitationData.email,
        businessId,
      });

      // Set expiration based on expiresInDays or default to 7 days
      const expirationDays = invitationData.expiresInDays || 7;
      const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

      // Insert invitation
      db.prepare(`
        INSERT INTO driver_invitations (
          id, business_id, email, name, phone, vehicle_type, license_plate, message,
          status, token, expires_at, invited_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invitationId,
        businessId,
        invitationData.email,
        invitationData.name,
        invitationData.phone || null,
        invitationData.vehicleType || null,
        invitationData.licensePlate || null,
        invitationData.message || null,
        'pending',
        token,
        expiresAt,
        invitedBy
      );

      // Send invitation email
      const inviteBaseUrl = process.env.INVITE_URL_BASE || 'https://app.zoneflow.app/accept-invite';
      const inviteUrl = `${inviteBaseUrl}/${encodeURIComponent(token)}`;
      
      EmailService.sendDriverInvite(invitationData.email, invitationData.name, inviteUrl, invitationData.message).catch((e) => {
        console.error('Failed to send driver invite:', e);
      });

      // Return the created invitation
      return this.getInvitationById(invitationId, businessId);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Create invitation error:', error);
      throw new ServiceError('Failed to create invitation');
    }
  }

  /**
   * Get paginated list of invitations for a business
   */
  static async getInvitations(
    businessId: string,
    pagination: { page: number; limit: number; offset: number }
  ): Promise<PaginatedInvitations> {
    try {
      // Get total count
      const totalResult = db.prepare(
        'SELECT COUNT(*) as count FROM driver_invitations WHERE business_id = ?'
      ).get(businessId) as { count: number };
      
      const total = totalResult.count;

      // Get paginated invitations with invited_by user name
      const invitations = db.prepare(`
        SELECT 
          di.*,
          u.name as invited_by_name
        FROM driver_invitations di
        LEFT JOIN users u ON di.invited_by = u.id
        WHERE di.business_id = ?
        ORDER BY di.created_at DESC
        LIMIT ? OFFSET ?
      `).all(businessId, pagination.limit, pagination.offset) as DriverInvitation[];

      return {
        invitations,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      console.error('Get invitations error:', error);
      throw new ServiceError('Failed to fetch invitations');
    }
  }

  /**
   * Get invitation statistics for a business
   */
  static async getInvitationStats(businessId: string): Promise<InvitationStats> {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
        FROM driver_invitations 
        WHERE business_id = ?
      `).get(businessId) as InvitationStats;

      return {
        total: stats.total || 0,
        pending: stats.pending || 0,
        accepted: stats.accepted || 0,
        cancelled: stats.cancelled || 0,
        expired: stats.expired || 0,
      };
    } catch (error) {
      console.error('Get invitation stats error:', error);
      throw new ServiceError('Failed to fetch invitation statistics');
    }
  }

  /**
   * Get a specific invitation by ID
   */
  static async getInvitationById(invitationId: string, businessId: string): Promise<DriverInvitation> {
    try {
      const invitation = db.prepare(`
        SELECT 
          di.*,
          u.name as invited_by_name
        FROM driver_invitations di
        LEFT JOIN users u ON di.invited_by = u.id
        WHERE di.id = ? AND di.business_id = ?
      `).get(invitationId, businessId) as DriverInvitation;

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      return invitation;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Get invitation by ID error:', error);
      throw new ServiceError('Failed to fetch invitation');
    }
  }

  /**
   * Get invitation by token (public endpoint)
   */
  static async getInvitationByToken(token: string): Promise<DriverInvitation> {
    try {
      const invitation = db.prepare(`
        SELECT 
          di.*,
          u.name as invited_by_name,
          b.name as business_name
        FROM driver_invitations di
        LEFT JOIN users u ON di.invited_by = u.id
        LEFT JOIN businesses b ON di.business_id = b.id
        WHERE di.token = ?
      `).get(token) as DriverInvitation & { business_name: string };

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        // Mark as expired
        db.prepare('UPDATE driver_invitations SET status = ? WHERE id = ?')
          .run('expired', invitation.id);
        throw new ValidationError('Invitation has expired');
      }

      // Check if invitation is not pending
      if (invitation.status !== 'pending') {
        throw new ValidationError(`Invitation is ${invitation.status}`);
      }

      return invitation;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Get invitation by token error:', error);
      throw new ServiceError('Failed to fetch invitation');
    }
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation(invitationId: string, businessId: string): Promise<void> {
    try {
      const invitation = await this.getInvitationById(invitationId, businessId);
      
      if (invitation.status !== 'pending') {
        throw new ValidationError('Only pending invitations can be cancelled');
      }

      db.prepare('UPDATE driver_invitations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('cancelled', invitationId);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Cancel invitation error:', error);
      throw new ServiceError('Failed to cancel invitation');
    }
  }

  /**
   * Bulk cancel invitations
   */
  static async bulkCancelInvitations(invitationIds: string[], businessId: string): Promise<{ cancelled: number; failed: number }> {
    try {
      let cancelled = 0;
      let failed = 0;

      for (const invitationId of invitationIds) {
        try {
          await this.cancelInvitation(invitationId, businessId);
          cancelled++;
        } catch (error) {
          failed++;
          console.error(`Failed to cancel invitation ${invitationId}:`, error);
        }
      }

      return { cancelled, failed };
    } catch (error) {
      console.error('Bulk cancel invitations error:', error);
      throw new ServiceError('Failed to cancel invitations');
    }
  }

  /**
   * Accept an invitation and create driver account
   */
  static async acceptInvitation(token: string, password: string): Promise<{ user: any; driver: any }> {
    try {
      // Get invitation by token
      const invitation = await this.getInvitationByToken(token);

      // Create user account
      const userId = generateId();
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const transaction = db.transaction(() => {
        // Create user
        db.prepare(`
          INSERT INTO users (id, email, password_hash, name, role, business_id, phone, is_active, is_invited)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          invitation.email,
          passwordHash,
          invitation.name,
          'driver',
          invitation.business_id,
          invitation.phone || null,
          1,
          1
        );

        // Create driver
        const driverId = generateId();
        db.prepare(`
          INSERT INTO drivers (id, user_id, business_id, vehicle_type, license_plate, is_available)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          driverId,
          userId,
          invitation.business_id,
          invitation.vehicle_type || null,
          invitation.license_plate || null,
          1
        );

        // Mark invitation as accepted
        db.prepare('UPDATE driver_invitations SET status = ?, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run('accepted', invitation.id);

        return { userId, driverId };
      });

      const { userId: createdUserId, driverId } = transaction();

      // Get created user and driver
      const user = db.prepare('SELECT id, email, name, role, business_id, phone, is_active FROM users WHERE id = ?')
        .get(createdUserId);
      
      const driver = db.prepare(`
        SELECT d.*, u.name, u.email, u.phone 
        FROM drivers d 
        JOIN users u ON d.user_id = u.id 
        WHERE d.id = ?
      `).get(driverId);

      return { user, driver };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Accept invitation error:', error);
      throw new ServiceError('Failed to accept invitation');
    }
  }

  /**
   * Clean up expired invitations (can be called periodically)
   */
  static async cleanupExpiredInvitations(): Promise<number> {
    try {
      const result = db.prepare(`
        UPDATE driver_invitations 
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP 
        WHERE status = 'pending' AND expires_at < datetime('now')
      `).run();

      return result.changes;
    } catch (error) {
      console.error('Cleanup expired invitations error:', error);
      throw new ServiceError('Failed to cleanup expired invitations');
    }
  }
}