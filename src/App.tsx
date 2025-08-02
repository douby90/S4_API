import React, { useState } from 'react';
import { Database, FileSpreadsheet, Globe, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ApiCredentialsForm } from './components/ApiCredentials';
import { EndpointDiscovery } from './components/EndpointDiscovery';
import { DataMapping } from './components/DataMapping';
import { SubmissionResults } from './components/SubmissionResults';
import { DataVerification } from './components/DataVerification';
import { ErrorPage } from './components/ErrorPage';
import { SpreadsheetData, ApiCredentials, ApiEndpoint, FieldMapping, SubmissionResult } from './types';
import { ApiClient } from './utils/apiClient';

type Step = 'upload' | 'credentials' | 'endpoints' | 'mapping' | 'submission' | 'verification' | 'error';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData | null>(null);
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (data: SpreadsheetData) => {
    setSpreadsheetData(data);
    setCurrentStep('credentials');
  };

  const handleCredentialsValidated = (creds: ApiCredentials, client: ApiClient) => {
    setCredentials(creds);
    setApiClient(client);
    setCurrentStep('endpoints');
  };

  const handleEndpointSelected = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (mappings: FieldMapping[]) => {
    setFieldMappings(mappings);
    setCurrentStep('submission');
  };

  const handleSubmissionComplete = (results: SubmissionResult[]) => {
    setSubmissionResults(results);
    setCurrentStep('verification');
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setCurrentStep('error');
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 'upload': return <FileSpreadsheet className="h-5 w-5" />;
      case 'credentials': return <Database className="h-5 w-5" />;
      case 'endpoints': return <Globe className="h-5 w-5" />;
      case 'mapping': return <Settings className="h-5 w-5" />;
      case 'submission': return <CheckCircle className="h-5 w-5" />;
      case 'verification': return <AlertCircle className="h-5 w-5" />;
      default: return null;
    }
  };

  const getStepStatus = (step: Step) => {
    const stepOrder: Step[] = ['upload', 'credentials', 'endpoints', 'mapping', 'submission', 'verification'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case 'upload': return 'Upload File';
      case 'credentials': return 'API Credentials';  
      case 'endpoints': return 'Select Endpoint';
      case 'mapping': return 'Map Data';
      case 'submission': return 'Submit Data';
      case 'verification': return 'Verify Results';
      default: return '';
    }
  };

  const steps: Step[] = ['upload', 'credentials', 'endpoints', 'mapping', 'submission', 'verification'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">SAP API Integration Tool</h1>
            </div>
            <div className="text-sm text-gray-500">
              Secure • Real-time • Production Ready
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep !== 'error' && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <nav aria-label="Progress">
                <ol className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const status = getStepStatus(step);
                    return (
                      <li key={step} className="flex items-center">
                        <div className="flex items-center">
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
                            ${status === 'completed'
                              ? 'bg-green-600 border-green-600 text-white'
                              : status === 'current'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-400'
                            }
                          `}>
                            {status === 'completed' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              getStepIcon(step)
                            )}
                          </div>
                          <span className={`
                            ml-2 text-sm font-medium transition-all
                            ${status === 'completed' || status === 'current'
                              ? 'text-gray-900'
                              : 'text-gray-500'
                            }
                          `}>
                            {getStepTitle(step)}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`
                            hidden sm:block w-16 h-0.5 ml-4 transition-all
                            ${getStepStatus(steps[index + 1]) !== 'pending'
                              ? 'bg-green-600'
                              : 'bg-gray-300'
                            }
                          `} />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {currentStep === 'upload' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Data</h2>
                <p className="text-gray-600">
                  Start by uploading an Excel file (.xlsx) with your data. The first row should contain column headers.
                </p>
              </div>
              <div className="max-w-2xl mx-auto">
                <FileUpload onFileUploaded={handleFileUpload} />
              </div>
            </div>
          )}

          {currentStep === 'credentials' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect to SAP API</h2>
                <p className="text-gray-600">
                  Enter your SAP API credentials to establish a secure connection.
                </p>
              </div>
              <div className="max-w-2xl mx-auto">
                <ApiCredentialsForm onCredentialsValidated={handleCredentialsValidated} onError={handleError} />
              </div>
            </div>
          )}

          {currentStep === 'endpoints' && apiClient && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover API Endpoints</h2>
                <p className="text-gray-600">
                  We'll automatically discover available endpoints and their requirements.
                </p>
              </div>
              <div className="max-w-4xl mx-auto">
                <EndpointDiscovery
                  apiClient={apiClient}
                  onEndpointSelected={handleEndpointSelected}
                  onError={handleError}
                />
              </div>
            </div>
          )}

          {currentStep === 'mapping' && spreadsheetData && selectedEndpoint && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Your Data</h2>
                <p className="text-gray-600">
                  Connect your spreadsheet columns to the API endpoint fields.
                </p>
              </div>
              <div className="max-w-4xl mx-auto">
                <DataMapping 
                  spreadsheetData={spreadsheetData}
                  selectedEndpoint={selectedEndpoint}
                  onMappingComplete={handleMappingComplete}
                />
              </div>
            </div>
          )}

          {currentStep === 'submission' && spreadsheetData && selectedEndpoint && apiClient && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Data</h2>
                <p className="text-gray-600">
                  Review and submit your data to the SAP API. Track progress in real-time.
                </p>
              </div>
              <div className="max-w-4xl mx-auto">
                <SubmissionResults
                  spreadsheetData={spreadsheetData}
                  selectedEndpoint={selectedEndpoint}
                  mappings={fieldMappings}
                  apiClient={apiClient}
                  onSubmissionComplete={handleSubmissionComplete}
                  onError={handleError}
                />
              </div>
            </div>
          )}

          {currentStep === 'verification' && apiClient && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Results</h2>
                <p className="text-gray-600">
                  Confirm your data was correctly stored by retrieving and comparing records.
                </p>
              </div>
              <div className="max-w-4xl mx-auto">
                <DataVerification
                  submissionResults={submissionResults}
                  apiClient={apiClient}
                  getEndpointUrl={selectedEndpoint?.fullUrl.replace(/\/(POST|PUT|DELETE)/i, '')}
                />
              </div>
            </div>
          )}

          {currentStep === 'error' && errorMessage && (
            <div className="max-w-2xl mx-auto">
              <ErrorPage
                message={errorMessage}
                onRetry={() => {
                  setErrorMessage(null);
                  setCurrentStep('upload');
                }}
              />
            </div>
          )}

          {/* Data Summary Panel */}
          {currentStep !== 'error' && spreadsheetData && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Loaded Data Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">File:</span>
                    <p className="font-medium text-gray-900 truncate">{spreadsheetData.headers.length > 0 ? 'Loaded' : 'No data'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Columns:</span>
                    <p className="font-medium text-gray-900">{spreadsheetData.headers.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rows:</span>
                    <p className="font-medium text-gray-900">{spreadsheetData.rows.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium text-green-600">Ready</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              🔒 Your credentials and data are processed securely and never stored permanently
            </p>
            <p className="text-xs text-gray-400">
              SAP API Integration Tool • Production Ready • Real-time Processing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;