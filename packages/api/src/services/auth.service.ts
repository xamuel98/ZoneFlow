import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateId } from '@zoneflow/shared';
import db from '../database/connection.js';
import {
  RegisterData,
  LoginData,
  AuthResult,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ServiceError
} from '../types/services.js';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(registerData: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(registerData.email);
      if (existingUser) {
        throw new ConflictError('User already exists with this email');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(registerData.password, 12);
      const userId = generateId();

      // Start transaction
      const transaction = db.transaction(() => {
        // Create user
        db.prepare(`
          INSERT INTO users (id, email, password_hash, name, role, phone)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, registerData.email, passwordHash, registerData.name, registerData.role, registerData.phone || null);

        // If business owner, create business
        let businessId = null;
        if (registerData.role === 'business_owner') {
          businessId = generateId();
          const businessName = registerData.businessName || `${registerData.name}'s Business`;
          
          db.prepare(`
            INSERT INTO businesses (id, name, owner_id, email, phone)
            VALUES (?, ?, ?, ?, ?)
          `).run(businessId, businessName, userId, registerData.email, registerData.phone || null);

          // Update user with business_id
          db.prepare('UPDATE users SET business_id = ? WHERE id = ?').run(businessId, userId);
        }

        return { userId, businessId };
      });

      const result = transaction();

      // Generate JWT token
      const token = this.generateToken({
        userId: result.userId,
        email: registerData.email,
        role: registerData.role,
        businessId: result.businessId || undefined,
      });

      return {
        user: {
          id: result.userId,
          email: registerData.email,
          name: registerData.name,
          role: registerData.role,
          businessId: result.businessId || undefined,
        },
        token,
      };
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      console.error('Registration error:', error);
      throw new ServiceError('Registration failed');
    }
  }

  /**
   * Login user
   */
  static async login(loginData: LoginData): Promise<AuthResult> {
    try {
      // Find user
      const user = db.prepare(`
        SELECT id, email, password_hash, name, role, business_id, is_active
        FROM users 
        WHERE email = ?
      `).get(loginData.email) as {
        id: string;
        email: string;
        password_hash: string;
        name: string;
        role: string;
        business_id?: string;
        is_active: number;
      } | undefined;

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new UnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password_hash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        businessId: user.business_id,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.business_id,
        },
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      console.error('Login error:', error);
      throw new ServiceError('Login failed');
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    businessId?: string;
    businessName?: string;
    phone?: string;
    isActive: boolean;
  }> {
    try {
      const user = db.prepare(`
        SELECT u.*, b.name as business_name
        FROM users u
        LEFT JOIN businesses b ON u.business_id = b.id
        WHERE u.id = ?
      `).get(userId) as {
        id: string;
        email: string;
        name: string;
        role: string;
        business_id?: string;
        business_name?: string;
        phone?: string;
        is_active: number;
      } | undefined;

      if (!user) {
        throw new NotFoundError('User');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.business_id,
        businessName: user.business_name,
        phone: user.phone,
        isActive: Boolean(user.is_active),
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching user profile:', error);
      throw new ServiceError('Failed to fetch user profile');
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(token: string): Promise<{ token: string }> {
    try {
      // Verify current token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        role: string;
        businessId?: string;
      };

      // Check if user still exists and is active
      const user = db.prepare(`
        SELECT id, email, name, role, business_id, is_active
        FROM users 
        WHERE id = ?
      `).get(decoded.userId) as {
        id: string;
        email: string;
        name: string;
        role: string;
        business_id?: string;
        is_active: number;
      } | undefined;

      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      // Generate new token
      const newToken = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        businessId: user.business_id,
      });

      return { token: newToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      console.error('Token refresh error:', error);
      throw new ServiceError('Failed to refresh token');
    }
  }

  /**
   * Verify JWT token and return user data
   */
  static async verifyToken(token: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    businessId?: string;
  }> {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        role: string;
        businessId?: string;
      };

      // Check if user still exists and is active
      const user = db.prepare(`
        SELECT id, email, name, role, business_id, is_active
        FROM users 
        WHERE id = ?
      `).get(decoded.userId) as {
        id: string;
        email: string;
        name: string;
        role: string;
        business_id?: string;
        is_active: number;
      } | undefined;

      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.business_id,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      console.error('Token verification error:', error);
      throw new ServiceError('Failed to verify token');
    }
  }

  /**
   * Create invitation token (JWT) for user email and optional business
   */
  static createInviteToken(payload: { userId: string; email: string; businessId?: string }): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ServiceError('JWT secret not configured');
    return jwt.sign({
      type: 'invite',
      userId: payload.userId,
      email: payload.email,
      businessId: payload.businessId
    }, secret, { expiresIn: '7d' });
  }

  /**
   * Accept invitation by setting password and activating account
   */
  static async acceptInvite(token: string, password: string): Promise<{ token: string }> {
    try {
      const secret = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, secret) as { type: string; userId: string; email: string };
      if (!decoded || decoded.type !== 'invite') {
        throw new UnauthorizedError('Invalid invitation');
      }

      const user = db.prepare('SELECT id, email, is_active, is_invited FROM users WHERE id = ?').get(decoded.userId) as {
        id: string; email: string; is_active: number; is_invited: number;
      } | undefined;

      if (!user) {
        throw new NotFoundError('User');
      }

      // Hash password and activate account
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      db.prepare('UPDATE users SET password_hash = ?, is_active = 1, is_invited = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(passwordHash, user.id);

      // Issue auth token
      const auth = this.generateToken({ userId: user.id, email: decoded.email, role: 'driver' });
      return { token: auth };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
        throw error;
      }
      console.error('Accept invite error:', error);
      throw new ServiceError('Failed to accept invite');
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(payload: {
    userId: string;
    email: string;
    role: string;
    businessId?: string;
  }): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ServiceError('JWT secret not configured');
    }
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        businessId: payload.businessId,
      },
      secret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Create business for existing user
   */
  static async createBusiness(
    userId: string,
    businessData: {
      name: string;
      email?: string;
      phone?: string;
    }
  ): Promise<{
    id: string;
    name: string;
    ownerId: string;
    email?: string;
    phone?: string;
  }> {
    try {
      // Check if user exists and doesn't already have a business
      const user = db.prepare(`
        SELECT id, email, business_id, role
        FROM users 
        WHERE id = ?
      `).get(userId) as {
        id: string;
        email: string;
        business_id?: string;
        role: string;
      } | undefined;

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.business_id) {
        throw new ConflictError('User already has a business');
      }

      if (user.role !== 'business_owner') {
        throw new ValidationError('Only business owners can create businesses');
      }

      const businessId = generateId();

      // Start transaction
      const transaction = db.transaction(() => {
        // Create business
        db.prepare(`
          INSERT INTO businesses (id, name, owner_id, email, phone)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          businessId,
          businessData.name,
          userId,
          businessData.email || user.email,
          businessData.phone || null
        );

        // Update user with business_id
        db.prepare('UPDATE users SET business_id = ? WHERE id = ?').run(businessId, userId);

        return businessId;
      });

      transaction();

      return {
        id: businessId,
        name: businessData.name,
        ownerId: userId,
        email: businessData.email || user.email,
        phone: businessData.phone,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating business:', error);
      throw new ServiceError('Failed to create business');
    }
  }
}