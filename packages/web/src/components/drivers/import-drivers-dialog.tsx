import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { useDriverStore } from '../../stores/driver-store';

const ImportDriversDialog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importDrivers, isLoading } = useDriverStore();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isOpen = location.pathname === '/drivers/import';

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate('/drivers');
    }
  };

  const acceptedFileTypes = '.csv,.xlsx,.xls';
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleClose = () => {
    navigate('/drivers');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB';
    }

    // Check file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      return 'Only CSV and Excel files are supported';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await importDrivers(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Drivers imported successfully');
      handleClose();
    } catch (error) {
      console.error('Failed to import drivers:', error);
      toast.error('Failed to import drivers. Please check the file format and try again.');
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    // Updated template to match backend CreateDriverData schema
    const csvContent = `name,email,phone,password,vehicleType,licensePlate,isAvailable
John Doe,john.doe@example.com,+1234567890,password123,car,ABC123,true
Jane Smith,jane.smith@example.com,+1987654321,password456,motorcycle,XYZ789,true
Mike Johnson,mike.johnson@example.com,+1122334455,password789,van,DEF456,false`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'driver-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Drivers</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple drivers at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Download the template file to see the required format for importing drivers.
              <Button
                variant="link"
                className="p-0 h-auto ml-2"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-1" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Upload File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      Drop your file here, or{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </Button>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports CSV, Excel files up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Drivers'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDriversDialog;