import { apiService } from './api';
import type { Driver, PaginatedResponse } from '@zoneflow/shared';
import type { BulkDriverOperation, BulkOperationResult, ImportProgress, DriverImportPreview } from '../types';

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

  // Enhanced bulk operations
  async bulkUpdateDrivers(operation: BulkDriverOperation): Promise<BulkOperationResult> {
    return apiService.post<BulkOperationResult>(`${this.baseUrl}/bulk-update`, operation);
  }

  async bulkDeleteDrivers(driverIds: string[]): Promise<BulkOperationResult> {
    return apiService.post<BulkOperationResult>(`${this.baseUrl}/bulk-delete`, { driverIds });
  }

  async bulkUpdateStatus(driverIds: string[], status: 'available' | 'busy' | 'offline'): Promise<BulkOperationResult> {
    return apiService.post<BulkOperationResult>(`${this.baseUrl}/bulk-status`, { driverIds, status });
  }

  // Enhanced import with preview
  async previewImport(file: File): Promise<DriverImportPreview> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${this.baseUrl}/import/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Preview failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Preview failed');
    }

    return result.data;
  }

  // Import with progress tracking
  async importDriversWithProgress(
    file: File, 
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{ created: Driver[]; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    // Create a promise that handles the upload with progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const uploadProgress = Math.round((event.loaded / event.total) * 50); // Upload is 50% of total
          onProgress({
            stage: 'uploading',
            progress: uploadProgress,
            message: 'Uploading file...',
          });
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (!result.success) {
              reject(new Error(result.error || 'Import failed'));
              return;
            }
            
            if (onProgress) {
              onProgress({
                stage: 'completed',
                progress: 100,
                message: 'Import completed successfully',
              });
            }
            
            resolve(result.data);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || 'Import failed'));
          } catch {
            reject(new Error('Import failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during import'));
      });

      const token = localStorage.getItem('auth-storage') 
        ? JSON.parse(localStorage.getItem('auth-storage')!).state.token 
        : '';

      xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${this.baseUrl}/import`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      if (onProgress) {
        onProgress({
          stage: 'uploading',
          progress: 0,
          message: 'Starting upload...',
        });
      }
      
      xhr.send(formData);
    });
  }

  // Export drivers
  async exportDrivers(format: 'csv' | 'xlsx' = 'csv', filters?: DriverFilters): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search);

    const url = `${this.baseUrl}/export?${queryParams.toString()}`;
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}

export const driverService = new DriverService();