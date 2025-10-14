import { Context } from 'hono';

// User information that gets attached to context after authentication
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  businessId?: string;
}

// Extend Hono's context to include our custom variables
export interface AppContext extends Context {
  get(key: 'user'): AuthUser;
  set(key: 'user', value: AuthUser): void;
}

// Type for middleware functions
export type AppMiddleware = (c: AppContext, next: () => Promise<void>) => Promise<Response | void>;