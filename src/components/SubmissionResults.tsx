import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { SpreadsheetData, ApiEndpoint, FieldMapping, SubmissionResult } from '../types';
import { ApiClient } from '../utils/apiClient';

interface SubmissionResultsProps {
  spreadsheetData: SpreadsheetData;
  selectedEndpoint: ApiEndpoint;
  mappings: FieldMapping[];
  apiClient: ApiClient;
  onSubmissionComplete: (results: SubmissionResult[]) => void;
}

export const SubmissionResults: React.FC<SubmissionResultsProps> = ({
  spreadsheetData,
  selectedEndpoint,
  mappings,
  apiClient,
  onSubmissionComplete
}) => {
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  const [showDetails, setShowDetails] = useState<number | null>(null);

  useEffect(() => {
    // Initialize results
    const initialResults: SubmissionResult[] = spreadsheetData.rows.map((_, index) => ({
      rowIndex: index,
      status: 'pending'
    }));
    setResults(initialResults);
  }, [spreadsheetData]);

  const generatePayload = (rowIndex: number) => {
    const row = spreadsheetData.rows[rowIndex];
    const payload: any = {};
    
    mappings.forEach(mapping => {
      const value = row[mapping.spreadsheetColumn];
      payload[mapping.apiField] = value;
    });
    
    return payload;
  };

  const submitRow = async (rowIndex: number) => {
    const payload = generatePayload(rowIndex);
    
    setResults(prev => prev.map(r => 
      r.rowIndex === rowIndex 
        ? { ...r, status: 'pending', payload }
        : r
    ));

    try {
      const response = await apiClient.submitData(selectedEndpoint, payload);
      const responseData = response.ok ? await response.json() : null;

      setResults(prev => prev.map(r => 
        r.rowIndex === rowIndex 
          ? { 
              ...r, 
              status: response.ok ? 'success' : 'error',
              response: responseData,
              error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
            }
          : r
      ));
    } catch (error) {
      setResults(prev => prev.map(r => 
        r.rowIndex === rowIndex 
          ? { 
              ...r, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : r
      ));
    }
  };

  const startSubmission = async () => {
    setIsRunning(true);
    setIsPaused(false);

    for (let i = currentRow; i < spreadsheetData.rows.length; i++) {
      if (isPaused) break;
      
      setCurrentRow(i);
      await submitRow(i);
      
      // Small delay between requests to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    
    if (currentRow >= spreadsheetData.rows.length - 1) {
      onSubmissionComplete(results);
    }
  };

  const pauseSubmission = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const resetSubmission = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentRow(0);
    const resetResults: SubmissionResult[] = spreadsheetData.rows.map((_, index) => ({
      rowIndex: index,
      status: 'pending'
    }));
    setResults(resetResults);
  };

  const getStatusIcon = (status: SubmissionResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SubmissionResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 border-green-200';
      case 'error': return 'bg-red-100 border-red-200';
      case 'pending': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;
  const progress = ((successCount + errorCount) / results.length) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Data Submission</h3>
          <div className="flex items-center space-x-2">
            {!isRunning && currentRow === 0 && (
              <button
                onClick={startSubmission}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Submission</span>
              </button>
            )}
            
            {!isRunning && currentRow > 0 && currentRow < spreadsheetData.rows.length && (
              <button
                onClick={startSubmission}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </button>
            )}
            
            {isRunning && (
              <button
                onClick={pauseSubmission}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            )}
            
            <button
              onClick={resetSubmission}
              disabled={isRunning}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {Math.round(progress)}%</span>
            <span>{successCount + errorCount} of {results.length} processed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-green-800">Successful</div>
          </div>
          <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-red-800">Errors</div>
          </div>
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
            <div className="text-sm text-gray-800">Pending</div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg transition-all ${getStatusColor(result.status)}`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <span className="text-sm font-medium">Row {result.rowIndex + 1}</span>
                  {result.status === 'error' && result.error && (
                    <span className="text-xs text-red-600 truncate max-w-xs">
                      {result.error}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowDetails(showDetails === index ? null : index)}
                  className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  <Eye className="h-3 w-3" />
                  <span>Details</span>
                </button>
              </div>

              {showDetails === index && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-3 space-y-3">
                    {result.payload && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Payload Sent</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.response && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Server Response</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.error && (
                      <div>
                        <p className="text-xs font-medium text-red-700 mb-1">Error Details</p>
                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {result.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-800">
              Submitting data... Currently processing row {currentRow + 1} of {spreadsheetData.rows.length}
            </p>
          </div>
        </div>
      )}

      {errorCount > 0 && !isRunning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {errorCount} rows failed to submit
              </p>
              <p className="text-xs text-red-600">
                Check the details above to see specific error messages and retry if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};