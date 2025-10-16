import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { driverService } from '../../services/driver-service';
import type { DriverImportPreview, ImportProgress } from '../../types';

interface ImportDriversDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

function ImportDriversDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportDriversDialogProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DriverImportPreview | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      handlePreview(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handlePreview = async (file: File) => {
    setIsLoading(true);
    try {
      const previewData = await driverService.previewImport(file);
      setPreview(previewData);
      setCurrentStep('preview');
    } catch (error: any) {
      toast.error('Failed to preview file', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setCurrentStep('importing');
    setProgress({ processed: 0, total: preview?.validRows.length || 0, errors: [] });

    try {
      await driverService.importDriversWithProgress(
        selectedFile,
        (progressData) => {
          setProgress(progressData);
        }
      );

      setCurrentStep('complete');
      toast.success('Drivers imported successfully', {
        description: `${progress?.processed || 0} drivers processed`,
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error('Import failed', {
        description: error.message,
      });
      setCurrentStep('preview');
    }
  };

  const handleClose = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setPreview(null);
    setProgress(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,phone,license_number,vehicle_type,status\nJohn Doe,john@example.com,+1234567890,DL123456,sedan,available\nJane Smith,jane@example.com,+1234567891,DL123457,suv,available';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drivers-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select a file
          </p>
          <p className="text-xs text-muted-foreground">
            Supports CSV, XLS, XLSX files (max 10MB)
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Processing file...</span>
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* File Info */}
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <FileText className="h-5 w-5" />
        <div className="flex-1">
          <p className="font-medium">{selectedFile?.name}</p>
          <p className="text-sm text-muted-foreground">
            {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('upload')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">Valid</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {preview?.validRows.length || 0}
          </p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-600">Invalid</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {preview?.invalidRows.length || 0}
          </p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-600">Duplicates</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {preview?.duplicates.length || 0}
          </p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border rounded-lg max-h-64 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview?.validRows.slice(0, 5).map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.phone}</TableCell>
                <TableCell>{row.license_number}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            ))}
            {preview?.invalidRows.slice(0, 3).map((row, index) => (
              <TableRow key={`invalid-${index}`}>
                <TableCell>
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </Badge>
                </TableCell>
                <TableCell>{row.data.name || '-'}</TableCell>
                <TableCell>{row.data.email || '-'}</TableCell>
                <TableCell>{row.data.phone || '-'}</TableCell>
                <TableCell>{row.data.license_number || '-'}</TableCell>
                <TableCell>
                  <div className="text-xs text-red-600">
                    {row.errors.join(', ')}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(preview?.validRows.length || 0) > 5 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing first 5 valid rows. {(preview?.validRows.length || 0) - 5} more rows will be imported.
        </p>
      )}
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Importing Drivers</h3>
        <p className="text-muted-foreground">
          Processing {progress?.processed || 0} of {progress?.total || 0} drivers
        </p>
      </div>
      <Progress 
        value={progress ? (progress.processed / progress.total) * 100 : 0} 
        className="w-full"
      />
      {progress && progress.errors.length > 0 && (
        <div className="text-left">
          <p className="text-sm font-medium text-red-600 mb-2">
            {progress.errors.length} errors occurred:
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {progress.errors.slice(0, 5).map((error, index) => (
              <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Row {error.row}: {error.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Import Complete</h3>
        <p className="text-muted-foreground">
          Successfully imported {progress?.processed || 0} drivers
        </p>
        {progress && progress.errors.length > 0 && (
          <p className="text-sm text-yellow-600">
            {progress.errors.length} rows had errors and were skipped
          </p>
        )}
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'preview':
        return renderPreviewStep();
      case 'importing':
        return renderImportingStep();
      case 'complete':
        return renderCompleteStep();
    }
  };

  const getDialogTitle = () => {
    switch (currentStep) {
      case 'upload':
        return 'Import Drivers';
      case 'preview':
        return 'Preview Import';
      case 'importing':
        return 'Importing Drivers';
      case 'complete':
        return 'Import Complete';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {currentStep === 'upload' && 'Upload a CSV or Excel file to import drivers'}
            {currentStep === 'preview' && 'Review the data before importing'}
            {currentStep === 'importing' && 'Please wait while we import your drivers'}
            {currentStep === 'complete' && 'Your drivers have been imported successfully'}
          </DialogDescription>
        </DialogHeader>

        {getStepContent()}

        <DialogFooter>
          {currentStep === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {currentStep === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={(preview?.validRows.length || 0) === 0}
              >
                Import {preview?.validRows.length || 0} Drivers
              </Button>
            </>
          )}
          {currentStep === 'complete' && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImportDriversDialog;