import * as XLSX from 'xlsx';
import { SpreadsheetData } from '../types';

export const parseXLSXFile = (file: File): Promise<SpreadsheetData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        }) as any[][];
        
        if (jsonData.length === 0) {
          throw new Error('Spreadsheet is empty');
        }
        
        const headers = jsonData[0].map(h => String(h).trim());
        const rows = jsonData.slice(1).map((row, index) => {
          const rowData: Record<string, any> = {};
          headers.forEach((header, colIndex) => {
            rowData[header] = row[colIndex] || '';
          });
          rowData._rowIndex = index;
          return rowData;
        });
        
        resolve({ headers, rows });
      } catch (error) {
        reject(new Error(`Failed to parse XLSX file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const validateSpreadsheetData = (data: SpreadsheetData): string[] => {
  const errors: string[] = [];
  
  if (data.headers.length === 0) {
    errors.push('No headers found in spreadsheet');
  }
  
  if (data.rows.length === 0) {
    errors.push('No data rows found in spreadsheet');
  }
  
  // Check for duplicate headers
  const duplicateHeaders = data.headers.filter((header, index) => 
    data.headers.indexOf(header) !== index
  );
  
  if (duplicateHeaders.length > 0) {
    errors.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`);
  }
  
  return errors;
};