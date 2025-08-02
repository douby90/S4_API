import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { SubmissionResult, VerificationResult } from '../types';
import { ApiClient } from '../utils/apiClient';

interface DataVerificationProps {
  submissionResults: SubmissionResult[];
  apiClient: ApiClient;
  getEndpointUrl?: string;
}

export const DataVerification: React.FC<DataVerificationProps> = ({
  submissionResults,
  apiClient,
  getEndpointUrl
}) => {
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  const successfulSubmissions = submissionResults.filter(r => r.status === 'success');

  useEffect(() => {
    if (successfulSubmissions.length > 0) {
      initializeVerification();
    }
  }, [submissionResults]);

  const initializeVerification = () => {
    const initialResults: VerificationResult[] = successfulSubmissions.map(result => ({
      rowIndex: result.rowIndex,
      submitted: result.payload,
      status: 'error',
      error: 'Verification not started'
    }));
    setVerificationResults(initialResults);
  };

  const startVerification = async () => {
    if (!getEndpointUrl) {
      setVerificationResults(prev => prev.map(r => ({
        ...r,
        status: 'error',
        error: 'No GET endpoint provided for verification'
      })));
      return;
    }

    setIsVerifying(true);

    for (const result of successfulSubmissions) {
      try {
        // Extract identifier from response (commonly 'id' field)
        const identifier = result.response?.id || result.response?.ID || result.payload?.id;
        
        if (!identifier) {
          setVerificationResults(prev => prev.map(r => 
            r.rowIndex === result.rowIndex 
              ? { ...r, status: 'error', error: 'No identifier found in response' }
              : r
          ));
          continue;
        }

        const verifyResponse = await apiClient.verifyData(getEndpointUrl, identifier);
        
        if (verifyResponse.ok) {
          const retrievedData = await verifyResponse.json();
          const isMatch = compareData(result.payload, retrievedData);
          
          setVerificationResults(prev => prev.map(r => 
            r.rowIndex === result.rowIndex 
              ? { 
                  ...r, 
                  status: isMatch ? 'verified' : 'mismatch',
                  retrieved: retrievedData,
                  error: undefined
                }
              : r
          ));
        } else if (verifyResponse.status === 404) {
          setVerificationResults(prev => prev.map(r => 
            r.rowIndex === result.rowIndex 
              ? { ...r, status: 'not_found', error: 'Record not found' }
              : r
          ));
        } else {
          setVerificationResults(prev => prev.map(r => 
            r.rowIndex === result.rowIndex 
              ? { 
                  ...r, 
                  status: 'error', 
                  error: `HTTP ${verifyResponse.status}: ${verifyResponse.statusText}` 
                }
              : r
          ));
        }
        
        // Small delay between verification requests
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        setVerificationResults(prev => prev.map(r => 
          r.rowIndex === result.rowIndex 
            ? { 
                ...r, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Verification failed' 
              }
            : r
        ));
      }
    }

    setIsVerifying(false);
  };

  const compareData = (submitted: any, retrieved: any): boolean => {
    // Simple comparison - checks if all submitted fields match retrieved fields
    for (const [key, value] of Object.entries(submitted)) {
      if (retrieved[key] !== value) {
        return false;
      }
    }
    return true;
  };

  const getStatusIcon = (status: VerificationResult['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'mismatch':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'not_found':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: VerificationResult['status']) => {
    switch (status) {
      case 'verified': return 'bg-green-100 border-green-200';
      case 'mismatch': return 'bg-yellow-100 border-yellow-200';
      case 'not_found': return 'bg-red-100 border-red-200';
      case 'error': return 'bg-red-100 border-red-200';
      default: return 'bg-red-100 border-red-200';
    }
  };

  const verifiedCount = verificationResults.filter(r => r.status === 'verified').length;
  const mismatchCount = verificationResults.filter(r => r.status === 'mismatch').length;
  const errorCount = verificationResults.filter(r => r.status === 'error' || r.status === 'not_found').length;

  if (successfulSubmissions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600">No successful submissions to verify</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Data Verification</h3>
          <button
            onClick={startVerification}
            disabled={isVerifying || !getEndpointUrl}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : 'Start Verification'}</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Verification checks if submitted data was correctly stored by making GET requests to retrieve the records.
        </p>

        {!getEndpointUrl && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">No GET endpoint specified</p>
                <p className="text-xs text-yellow-600">
                  Please specify a GET endpoint URL to enable data verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {verificationResults.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
              <div className="text-sm text-green-800">Verified</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{mismatchCount}</div>
              <div className="text-sm text-yellow-800">Mismatched</div>
            </div>
            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-800">Errors</div>
            </div>
          </div>
        )}

        {/* Verification Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {verificationResults.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg transition-all ${getStatusColor(result.status)}`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <span className="text-sm font-medium">Row {result.rowIndex + 1}</span>
                  <span className="text-xs text-gray-600 capitalize">{result.status.replace('_', ' ')}</span>
                  {result.error && (
                    <span className="text-xs text-red-600 truncate max-w-xs">
                      {result.error}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setExpandedResult(expandedResult === index ? null : index)}
                  className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  <Eye className="h-3 w-3" />
                  <span>Details</span>
                </button>
              </div>

              {expandedResult === index && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Submitted Data</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.submitted, null, 2)}
                      </pre>
                    </div>
                    
                    {result.retrieved && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Retrieved Data</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.retrieved, null, 2)}
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

        {isVerifying && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800">Verifying submitted data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};