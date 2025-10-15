import { create } from 'zustand';
import type { Driver } from '@zoneflow/shared';
import { 
  driverService, 
  type CreateDriverRequest, 
  type UpdateDriverRequest, 
  type BulkCreateDriverRequest,
  type DriverListParams 
} from '../services/driver-service';

interface DriverState {
  drivers: Driver[];
  selectedDriver: Driver | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isImporting: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    status?: 'available' | 'busy' | 'offline';
    search?: string;
  };
  stats: {
    total: number;
    available: number;
    busy: number;
    offline: number;
  } | null;
}

interface DriverActions {
  // Data fetching
  fetchDrivers: (params?: DriverListParams) => Promise<void>;
  fetchDriver: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  
  // CRUD operations
  createDriver: (data: CreateDriverRequest) => Promise<Driver>;
  updateDriver: (id: string, data: UpdateDriverRequest) => Promise<Driver>;
  deleteDriver: (id: string) => Promise<void>;
  
  // Bulk operations
  createDriversBulk: (data: BulkCreateDriverRequest) => Promise<void>;
  importDrivers: (file: File) => Promise<void>;
  
  // State management
  setSelectedDriver: (driver: Driver | null) => void;
  setFilters: (filters: Partial<DriverState['filters']>) => void;
  setPagination: (pagination: Partial<DriverState['pagination']>) => void;
  clearDrivers: () => void;
}

export const useDriverStore = create<DriverState & DriverActions>((set, get) => ({
  // Initial state
  drivers: [],
  selectedDriver: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isImporting: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {},
  stats: null,

  // Data fetching actions
  fetchDrivers: async (params?: DriverListParams) => {
    set({ isLoading: true });
    try {
      const currentState = get();
      const queryParams = {
        ...currentState.filters,
        page: currentState.pagination.page,
        limit: currentState.pagination.limit,
        ...params,
      };

      const response = await driverService.getDrivers(queryParams);
      
      set({
        drivers: response.data,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  fetchDriver: async (id: string) => {
    set({ isLoading: true });
    try {
      const driver = await driverService.getDriver(id);
      set({ selectedDriver: driver, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch driver:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const stats = await driverService.getDriverStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch driver stats:', error);
      throw error;
    }
  },

  // CRUD operations
  createDriver: async (data: CreateDriverRequest) => {
    set({ isCreating: true });
    try {
      const newDriver = await driverService.createDriver(data);
      
      // Add to current drivers list
      set((state) => ({
        drivers: [newDriver, ...state.drivers],
        isCreating: false,
      }));

      // Refresh stats
      get().fetchStats();
      
      return newDriver;
    } catch (error) {
      console.error('Failed to create driver:', error);
      set({ isCreating: false });
      throw error;
    }
  },

  updateDriver: async (id: string, data: UpdateDriverRequest) => {
    set({ isUpdating: true });
    try {
      const updatedDriver = await driverService.updateDriver(id, data);
      
      // Update in current drivers list
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === id ? updatedDriver : driver
        ),
        selectedDriver: state.selectedDriver?.id === id ? updatedDriver : state.selectedDriver,
        isUpdating: false,
      }));

      // Refresh stats
      get().fetchStats();
      
      return updatedDriver;
    } catch (error) {
      console.error('Failed to update driver:', error);
      set({ isUpdating: false });
      throw error;
    }
  },

  deleteDriver: async (id: string) => {
    set({ isDeleting: true });
    try {
      await driverService.deleteDriver(id);
      
      // Remove from current drivers list
      set((state) => ({
        drivers: state.drivers.filter((driver) => driver.id !== id),
        selectedDriver: state.selectedDriver?.id === id ? null : state.selectedDriver,
        isDeleting: false,
      }));

      // Refresh stats
      get().fetchStats();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      set({ isDeleting: false });
      throw error;
    }
  },

  // Bulk operations
  createDriversBulk: async (data: BulkCreateDriverRequest) => {
    set({ isImporting: true });
    try {
      const result = await driverService.createDriversBulk(data);
      
      // Refresh the drivers list
      await get().fetchDrivers();
      
      // Refresh stats
      get().fetchStats();
      
      set({ isImporting: false });
      
      return result;
    } catch (error) {
      console.error('Failed to bulk create drivers:', error);
      set({ isImporting: false });
      throw error;
    }
  },

  importDrivers: async (file: File) => {
    set({ isImporting: true });
    try {
      const result = await driverService.importDrivers(file);
      
      // Refresh the drivers list
      await get().fetchDrivers();
      
      // Refresh stats
      get().fetchStats();
      
      set({ isImporting: false });
      
      return result;
    } catch (error) {
      console.error('Failed to import drivers:', error);
      set({ isImporting: false });
      throw error;
    }
  },

  // State management
  setSelectedDriver: (driver: Driver | null) => {
    set({ selectedDriver: driver });
  },

  setFilters: (filters: Partial<DriverState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page when filtering
    }));
  },

  setPagination: (pagination: Partial<DriverState['pagination']>) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  clearDrivers: () => {
    set({
      drivers: [],
      selectedDriver: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
      filters: {},
      stats: null,
    });
  },
}));