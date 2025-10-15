import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API response interfaces
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh and API errors
    this.api.interceptors.response.use(
      (response) => {
        // Handle API error responses that come with 200 status but success: false
        const data = response.data as ApiResponse<any>;
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          !data.success
        ) {
          const error = new Error(data.error || 'API request failed');
          error.name = 'ApiError';
          return Promise.reject(error);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await useAuthStore.getState().refreshToken();
            const token = useAuthStore.getState().token;
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle API error responses
        if (error.response?.data) {
          const apiError = error.response.data as ApiErrorResponse;
          if (
            apiError &&
            typeof apiError === 'object' &&
            'success' in apiError &&
            !apiError.success
          ) {
            const customError = new Error(
              apiError.error || 'API request failed'
            );
            customError.name = 'ApiError';
            return Promise.reject(customError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<ApiSuccessResponse<T>> = await this.api.get(
      url,
      { params }
    );
    return response.data.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiSuccessResponse<T>> = await this.api.post(
      url,
      data
    );
    return response.data.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiSuccessResponse<T>> = await this.api.put(
      url,
      data
    );
    return response.data.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiSuccessResponse<T>> = await this.api.patch(
      url,
      data
    );
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<ApiSuccessResponse<T>> =
      await this.api.delete(url);
    return response.data.data;
  }

  // Public API calls (without auth)
  async publicGet<T>(url: string, params?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axios.get(
        `${API_BASE_URL}${url}`,
        { params }
      );

      // Handle API error responses
      if (!response.data.success) {
        const errorData = response.data as unknown as ApiErrorResponse;
        const error = new Error(errorData.error || 'API request failed');
        error.name = 'ApiError';
        throw error;
      }

      return (response.data as ApiSuccessResponse<T>).data;
    } catch (error: any) {
      // Handle HTTP errors and API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiErrorResponse;
        if (
          apiError &&
          typeof apiError === 'object' &&
          'success' in apiError &&
          !apiError.success
        ) {
          const customError = new Error(apiError.error || 'API request failed');
          customError.name = 'ApiError';
          throw customError;
        }
      }
      throw error;
    }
  }

  async publicPost<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axios.post(
        `${API_BASE_URL}${url}`,
        data
      );

      // Handle API error responses
      if (!response.data.success) {
        const errorData = response.data as unknown as ApiErrorResponse;
        const error = new Error(errorData.error || 'API request failed');
        error.name = 'ApiError';
        throw error;
      }

      return (response.data as ApiSuccessResponse<T>).data;
    } catch (error: any) {
      // Handle HTTP errors and API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiErrorResponse;
        if (
          apiError &&
          typeof apiError === 'object' &&
          'success' in apiError &&
          !apiError.success
        ) {
          const customError = new Error(apiError.error || 'API request failed');
          customError.name = 'ApiError';
          throw customError;
        }
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();
