import { Hono } from 'hono';
import { validateRequest, registerSchema, loginSchema, acceptInviteSchema } from '../utils/validation.js';
import { ResponseHandler } from '../utils/response.js';
import { AuthService } from '../services/auth.service';
import { ServiceError, NotFoundError, ValidationError, UnauthorizedError, ConflictError } from '../types/services.js';

const auth = new Hono();

// Register new user
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = validateRequest(registerSchema, body);

    const result = await AuthService.register(data);

    return ResponseHandler.success(c, result, 'Registration successful');

  } catch (error: unknown) {
    console.error('Registration error:', error);
    if (error instanceof ConflictError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 
      error instanceof Error ? error.message : 'Registration failed'
    );
  }
});

// Login user
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = validateRequest(loginSchema, body);

    const result = await AuthService.login(data);

    return ResponseHandler.success(c, result, 'Login successful');

  } catch (error: unknown) {
    console.error('Login error:', error);
    if (error instanceof UnauthorizedError) {
      return ResponseHandler.unauthorized(c, error.message);
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 
      error instanceof Error ? error.message : 'Login failed'
    );
  }
});

// Get current user profile
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.unauthorized(c, 'Authorization token required');
    }

    const token = authHeader.substring(7);
    const user = await AuthService.verifyToken(token);
    const profile = await AuthService.getUserProfile(user.id);

    return ResponseHandler.success(c, {
      user: profile,
    }, 'User profile retrieved successfully');

  } catch (error: unknown) {
    console.error('Get profile error:', error);
    if (error instanceof UnauthorizedError) {
      return ResponseHandler.unauthorized(c, error.message);
    }
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'User');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to get user profile');
  }
});

// Refresh token endpoint
auth.post('/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.unauthorized(c, 'Authorization token required');
    }

    const token = authHeader.substring(7);
    const result = await AuthService.refreshToken(token);

    return ResponseHandler.success(c, result, 'Token refreshed successfully');

  } catch (error: unknown) {
    console.error('Token refresh error:', error);
    if (error instanceof UnauthorizedError) {
      return ResponseHandler.unauthorized(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.unauthorized(c, 'Failed to refresh token');
  }
});

export default auth;

// Accept invitation (public)
auth.post('/accept-invite', async (c) => {
  try {
    const body = await c.req.json();
    const data = validateRequest(acceptInviteSchema, body);

    const result = await AuthService.acceptInvite(data.token, data.password);
    return ResponseHandler.success(c, result, 'Invitation accepted');

  } catch (error: unknown) {
    console.error('Accept invite error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof UnauthorizedError) {
      return ResponseHandler.unauthorized(c, error.message);
    }
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'User');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to accept invitation');
  }
});