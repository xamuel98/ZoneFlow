import type { User } from '@zoneflow/shared'
import { apiService } from './api'

interface LoginResponse {
  user: User
  token: string
}

interface RegisterData {
  email: string
  password: string
  name: string
  role: 'business_owner' | 'driver'
  businessName?: string
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiService.publicPost('/api/auth/login', { email, password })
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    return apiService.publicPost('/api/auth/register', data)
  }

  async getProfile(): Promise<User> {
    return apiService.get('/api/auth/me')
  }

  async refreshToken(): Promise<string> {
    const response = await apiService.post<{ token: string }>('/api/auth/refresh')
    return response.token
  }
}

export const authService = new AuthService()