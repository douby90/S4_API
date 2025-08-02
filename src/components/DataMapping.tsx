import React, { useState, useMemo } from 'react';
import { ArrowRight, AlertCircle, CheckCircle, Eye, Settings } from 'lucide-react';
import { SpreadsheetData, ApiEndpoint, FieldMapping } from '../types';

interface DataMappingProps {
  spreadsheetData: SpreadsheetData;
  selectedEndpoint: ApiEndpoint;
  onMappingComplete: (mappings: FieldMapping[]) => void;
  disabled?: boolean;
}

export const DataMapping: React.FC<DataMappingProps> = ({
  spreadsheetData,
  selectedEndpoint,
  onMappingComplete,
  disabled
}) => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRowIndex, setPreviewRowIndex] = useState(0);

  const apiFields = useMemo(() => {
    const fields: any[] = [];
    
    // Add parameters
    if (selectedEndpoint.parameters) {
      fields.push(...selectedEndpoint.parameters);
    }
    
    // Add request body fields
    if (selectedEndpoint.requestBody?.schema.properties) {
      const bodyFields = Object.entries(selectedEndpoint.requestBody.schema.properties)
        .map(([name, field]) => ({ name, ...field }));
      fields.push(...bodyFields);
    }
    
    return fields;
  }, [selectedEndpoint]);

  const handleMappingChange = (apiField: string, spreadsheetColumn: string) => {
    setMappings(prev => {
      const existing = prev.find(m => m.apiField === apiField);
      if (existing) {
        if (spreadsheetColumn === '') {
          return prev.filter(m => m.apiField !== apiField);
        } else {
          return prev.map(m => 
            m.apiField === apiField 
              ? { ...m, spreadsheetColumn }
              : m
          );
        }
      } else if (spreadsheetColumn !== '') {
        return [...prev, { apiField, spreadsheetColumn, transform: '' }];
      }
      return prev;
    });
  };

  const generatePreviewPayload = (rowIndex: number) => {
    const row = spreadsheetData.roots[rowIndex];
    const payload: any = {};
    
    mappings.forEach(mapping => {
      const value = row[mapping.spreadsheetColumn];
      payload[mapping.apiField] = value;
    });
    
    return payload;
  };

  const validateMappings = () => {
    const errors: string[] = [];
    const requiredFields = apiFields.filter(field => field.required);
    
    requiredFields.forEach(field => {
      const mapping = mappings.find(m => m.apiField === field.name);
      if (!mapping) {
        errors.push(`Required field "${field.name}" is not mapped`);
      }
    });
    
    return errors;
  };

  const handleComplete = () => {
    const errors = validateMappings();
    if (errors.length === 0) {
      onMappingComplete(mappings);
    }
  };

  const validationErrors = validateMappings();
  const isValid = validationErrors.length === 0 && mappings.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Data Mapping</h3>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
            disabled={mappings.length === 0}
          >
            <Eye className="h-4 w-4" />
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Map your spreadsheet columns to the API endpoint fields. Required fields are marked with *.
        </p>

        <div className="space-y-4">
          {apiFields.map((field, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {field.name}
                    {field.required && <span className="text-red-600 ml-1">*</span>}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {field.type}
                    {field.format && ` (${field.format})`}
                  </span>
                </div>
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
                {field.enum && (
                  <p className="text-xs text-gray-500 mt-1">
                    Allowed values: {field.enum.join(', ')}
                  </p>
                )}
              </div>

              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />

              <div className="flex-1">
                <select
                  value={mappings.find(m => m.apiField === field.name)?.spreadsheetColumn || ''}
                  onChange={(e) => handleMappingChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="">Select column...</option>
                  {spreadsheetData.headers.map((header, headerIndex) => (
                    <option key={headerIndex} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Mapping Issues</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="list-disc list-inside">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleComplete}
            disabled={!isValid || disabled}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Continue to Data Submission</span>
          </button>
        </div>
      </div>

      {showPreview && mappings.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Preview Payload</h4>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Row:</label>
              <select
                value={previewRowIndex}
                onChange={(e) => setPreviewRowIndex(parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                {spreadsheetData.rows.map((_, index) => (
                  <option key={index} value={index}>Row {index + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(generatePreviewPayload(previewRowIndex), null, 2)}
            </pre>
          </div>
        </div>
      )}

      {isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Mapping complete! {mappings.length} field(s) mapped
              </p>
              <p className="text-xs text-green-600">Ready to submit {spreadsheetData.rows.length} rows</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};