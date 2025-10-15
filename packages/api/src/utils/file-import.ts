import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { CreateDriverData, DriverImportResult, ValidationError } from '../types/services.js';
import { validateRequest, createDriverSchema } from './validation.js';

export interface FileImportOptions {
  skipFirstRow?: boolean;
  columnMapping?: {
    name?: string;
    email?: string;
    phone?: string;
    vehicleType?: string;
    licensePlate?: string;
  };
}

export class FileImportService {
  /**
   * Parse Excel file and extract driver data
   */
  static async parseExcelFile(
    buffer: Buffer,
    options: FileImportOptions = {}
  ): Promise<CreateDriverData[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Skip header row if specified
      const dataRows = options.skipFirstRow ? jsonData.slice(1) : jsonData;
      
      return this.mapRowsToDriverData(dataRows, options.columnMapping);
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw new ValidationError('Failed to parse Excel file');
    }
  }

  /**
   * Parse CSV file and extract driver data
   */
  static async parseCSVFile(
    buffer: Buffer,
    options: FileImportOptions = {}
  ): Promise<CreateDriverData[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            const drivers = this.mapObjectsToDriverData(results, options.columnMapping);
            resolve(drivers);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          reject(new ValidationError('Failed to parse CSV file'));
        });
    });
  }

  /**
   * Map array rows to driver data (for Excel)
   */
  private static mapRowsToDriverData(
    rows: any[][],
    columnMapping?: FileImportOptions['columnMapping']
  ): CreateDriverData[] {
    const drivers: CreateDriverData[] = [];
    
    // Default column indices (can be overridden by mapping)
    const defaultMapping = {
      name: 0,
      email: 1,
      phone: 2,
      vehicleType: 3,
      licensePlate: 4
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      try {
        const driverData: CreateDriverData = {
          name: row[defaultMapping.name]?.toString().trim() || '',
          email: row[defaultMapping.email]?.toString().trim() || '',
          phone: row[defaultMapping.phone]?.toString().trim() || '',
          vehicleType: row[defaultMapping.vehicleType]?.toString().trim() || undefined,
          licensePlate: row[defaultMapping.licensePlate]?.toString().trim() || undefined,
          isAvailable: true
        };

        // Validate the driver data
        const validatedData = validateRequest(createDriverSchema, driverData);
        drivers.push(validatedData);
      } catch (error) {
        // Skip invalid rows but log the error
        console.warn(`Skipping row ${i + 1} due to validation error:`, error);
      }
    }

    return drivers;
  }

  /**
   * Map objects to driver data (for CSV)
   */
  private static mapObjectsToDriverData(
    objects: any[],
    columnMapping?: FileImportOptions['columnMapping']
  ): CreateDriverData[] {
    const drivers: CreateDriverData[] = [];
    
    // Default column names (can be overridden by mapping)
    const defaultMapping = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      vehicleType: 'vehicle_type',
      licensePlate: 'license_plate'
    };

    const mapping = { ...defaultMapping, ...columnMapping };

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj) continue;

      try {
        const driverData: CreateDriverData = {
          name: obj[mapping.name]?.toString().trim() || '',
          email: obj[mapping.email]?.toString().trim() || '',
          phone: obj[mapping.phone]?.toString().trim() || '',
          vehicleType: obj[mapping.vehicleType]?.toString().trim() || undefined,
          licensePlate: obj[mapping.licensePlate]?.toString().trim() || undefined,
          isAvailable: true
        };

        // Validate the driver data
        const validatedData = validateRequest(createDriverSchema, driverData);
        drivers.push(validatedData);
      } catch (error) {
        // Skip invalid rows but log the error
        console.warn(`Skipping row ${i + 1} due to validation error:`, error);
      }
    }

    return drivers;
  }

  /**
   * Validate file type
   */
  static validateFileType(filename: string): boolean {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }

  /**
   * Get file type from filename
   */
  static getFileType(filename: string): 'excel' | 'csv' | 'unknown' {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (['.xlsx', '.xls'].includes(extension)) {
      return 'excel';
    } else if (extension === '.csv') {
      return 'csv';
    }
    
    return 'unknown';
  }

  /**
   * Process file import and return results
   */
  static async processFileImport(
    buffer: Buffer,
    filename: string,
    options: FileImportOptions = {}
  ): Promise<CreateDriverData[]> {
    if (!this.validateFileType(filename)) {
      throw new ValidationError('Unsupported file type. Please upload Excel (.xlsx, .xls) or CSV files.');
    }

    const fileType = this.getFileType(filename);
    
    switch (fileType) {
      case 'excel':
        return await this.parseExcelFile(buffer, options);
      case 'csv':
        return await this.parseCSVFile(buffer, options);
      default:
        throw new ValidationError('Unsupported file type');
    }
  }
}