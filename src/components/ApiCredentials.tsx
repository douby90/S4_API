import React, { useState } from 'react';
import { Eye, EyeOff, Server, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ApiCredentials } from '../types';
import { ApiClient } from '../utils/apiClient';

interface ApiCredentialsProps {
  onCredentialsValidated: (credentials: ApiCredentials, client: ApiClient) => void;
  disabled?: boolean;
}

export const ApiCredentialsForm: React.FC<ApiCredentialsProps> = ({ 
  onCredentialsValidated, 
  disabled 
}) => {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    baseUrl: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof ApiCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setValidationStatus('idle');
    setError('');
  };

  const validateCredentials = async () => {
    if (!credentials.baseUrl || !credentials.username || !credentials.password) {
      setError('All fields are required');
      return;
    }

    // Basic URL validation
    try {
      new URL(credentials.baseUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const client = new ApiClient(credentials);
      const isConnected = await client.testConnection();
      
      if (isConnected) {
        setValidationStatus('success');
        onCredentialsValidated(credentials, client);
      } else {
        setValidationStatus('error');
        setError('Failed to connect to the API. Please check your credentials and URL.');
      }
    } catch (err) {
      setValidationStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsValidating(false);
    }
  };

  const isFormValid = credentials.baseUrl && credentials.username && credentials.password;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Server className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">SAP API Connection</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Base URL
            </label>
            <input
              type="url"
              value={credentials.baseUrl}
              onChange={(e) => handleInputChange('baseUrl', e.target.value)}
              placeholder="https://api.sap.com/your-instance"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled || isValidating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled || isValidating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled || isValidating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={disabled || isValidating}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={validateCredentials}
            disabled={!isFormValid || disabled || isValidating}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Validating...</span>
              </>
            ) : validationStatus === 'success' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Connected</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {validationStatus === 'success' && (
          <div className="mt-4 flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">Connection successful! Ready to discover endpoints.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Security Notice</p>
            <p>Your credentials are only used for this session and are never stored permanently. All connections use HTTPS when available.</p>
          </div>
        </div>
      </div>
    </div>
  );
};