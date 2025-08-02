export interface ApiCredentials {
  baseUrl: string;
  username: string;
  password: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  fullUrl: string;
  description: string;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  maxLength?: number;
  minLength?: number;
}

export interface ApiRequestBody {
  contentType: string;
  schema: ApiSchema;
}

export interface ApiSchema {
  type: string;
  properties: Record<string, ApiParameter>;
  required?: string[];
}

export interface SpreadsheetData {
  headers: string[];
  rows: Record<string, any>[];
}

export interface FieldMapping {
  spreadsheetColumn: string;
  apiField: string;
  transform?: string;
}

export interface SubmissionResult {
  rowIndex: number;
  status: 'success' | 'error' | 'pending';
  response?: any;
  error?: string;
  payload?: any;
}

export interface VerificationResult {
  rowIndex: number;
  submitted: any;
  retrieved?: any;
  status: 'verified' | 'mismatch' | 'not_found' | 'error';
  error?: string;
}