import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { SpreadsheetData } from '../types';

export const parseSpreadsheetFile = (file: File): Promise<SpreadsheetData> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    const handleData = (headers: string[], rowsData: string[][]) => {
      if (rowsData.length === 0) {
        throw new Error('Spreadsheet is empty');
      }

      const rows = rowsData.map((row, index) => {
        const rowData: Record<string, string> = {};
        headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex] || '';
        });
        rowData._rowIndex = index;
        return rowData;
      });

      resolve({ headers, rows });
    };

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;

        if (extension === 'xlsx') {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
          }) as string[][];

          const headers = jsonData[0].map((h) => String(h).trim());
          const rowsData = jsonData.slice(1);
          handleData(headers, rowsData);
        } else if (extension === 'csv') {
          const text =
            typeof data === 'string'
              ? data
              : new TextDecoder().decode(data as ArrayBuffer);
          const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
          const csvData = result.data as string[][];
          const headers = csvData[0].map((h) => String(h).trim());
          const rowsData = csvData.slice(1);
          handleData(headers, rowsData);
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (error) {
        reject(
          new Error(
            `Failed to parse file: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    if (extension === 'xlsx') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
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
  const duplicateHeaders = data.headers.filter(
    (header, index) => data.headers.indexOf(header) !== index
  );

  if (duplicateHeaders.length > 0) {
    errors.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`);
  }

  return errors;
};

