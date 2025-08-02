import React, { useCallback, useState } from 'react';
import { FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { SpreadsheetData } from '../types';
import { parseSpreadsheetFile, validateSpreadsheetData } from '../utils/spreadsheetParser';

interface FileUploadProps {
  onFileUploaded: (data: SpreadsheetData) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<SpreadsheetData | null>(null);
  const [error, setError] = useState<string>('');

  const handleFile = useCallback(async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
      setError('Please upload an .xlsx or .csv file');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const data = await parseSpreadsheetFile(file);
      const validationErrors = validateSpreadsheetData(data);

      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      setUploadedFile(file);
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleConfirm = useCallback(() => {
    if (previewData) {
      onFileUploaded(previewData);
      setPreviewData(null);
    }
  }, [previewData, onFileUploaded]);

  const handleCancel = useCallback(() => {
    setUploadedFile(null);
    setPreviewData(null);
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
          ${uploadedFile && !previewData ? 'border-green-500 bg-green-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Processing file...</p>
          </div>
        ) : uploadedFile && !previewData ? (
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
              <p className="text-xs text-green-600">File uploaded successfully</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <FileSpreadsheet className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drop your .xlsx or .csv file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Only .xlsx or .csv files are supported
              </p>
            </div>
          </div>
        )}
      </div>

      {previewData && (
        <div className="space-y-4">
          <div className="overflow-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {previewData.headers.map((header) => (
                    <th
                      key={header}
                      className="px-2 py-1 text-left text-xs font-medium text-gray-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.rows.slice(0, 5).map((row, idx) => (
                  <tr key={idx}>
                    {previewData.headers.map((header) => (
                      <td key={header} className="px-2 py-1 whitespace-nowrap">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 p-2">
              Showing first {Math.min(5, previewData.rows.length)} of {previewData.rows.length} rows
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Confirm Import
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};