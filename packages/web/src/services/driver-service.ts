import { apiService } from './api';
import type { Driver, PaginatedResponse } from '@zoneflow/shared';

// Updated to match backend CreateDriverData schema
export interface CreateDriverRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  vehicleType?: string;
  licensePlate?: string;
  isAvailable?: boolean;
}

// Updated to match backend UpdateDriverData schema
export interface UpdateDriverRequest {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  vehicleType?: string;
  licensePlate?: string;
  isAvailable?: boolean;
}

export interface BulkCreateDriverRequest {
  drivers: CreateDriverRequest[];
}

export interface DriverFilters {
  status?: 'available' | 'busy' | 'offline';
  search?: string;
}

export interface DriverListParams extends DriverFilters {
  page?: number;
  limit?: number;
}

class DriverService {
  private readonly baseUrl = '/api/drivers';

  // Get all drivers with pagination and filters
  async getDrivers(params: DriverListParams = {}): Promise<PaginatedResponse<Driver>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const url = queryParams.toString() 
      ? `${this.baseUrl}?${queryParams.toString()}`
      : this.baseUrl;

    return apiService.get<PaginatedResponse<Driver>>(url);
  }

  // Get single driver by ID
  async getDriver(id: string): Promise<Driver> {
    return apiService.get<Driver>(`${this.baseUrl}/${id}`);
  }

  // Create new driver
  async createDriver(data: CreateDriverRequest): Promise<Driver> {
    return apiService.post<Driver>(this.baseUrl, data);
  }

  // Update existing driver
  async updateDriver(id: string, data: UpdateDriverRequest): Promise<Driver> {
    return apiService.put<Driver>(`${this.baseUrl}/${id}`, data);
  }

  // Delete driver
  async deleteDriver(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  // Bulk create drivers
  async createDriversBulk(data: BulkCreateDriverRequest): Promise<{ created: Driver[]; errors: any[] }> {
    return apiService.post<{ created: Driver[]; errors: any[] }>(`${this.baseUrl}/bulk`, data);
  }

  // Import drivers from file
  async importDrivers(file: File): Promise<{ created: Driver[]; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    // Use the raw axios instance for file upload
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${this.baseUrl}/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Import failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Import failed');
    }

    return result.data;
  }

  // Get driver statistics
  async getDriverStats(): Promise<{
    total: number;
    available: number;
    busy: number;
    offline: number;
  }> {
    return apiService.get<{
      total: number;
      available: number;
      busy: number;
      offline: number;
    }>(`${this.baseUrl}/stats`);
  }
}

export const driverService = new DriverService();