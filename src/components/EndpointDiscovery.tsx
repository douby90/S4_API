import React, { useState, useEffect } from 'react';
import { Search, Globe, AlertCircle, CheckCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { ApiEndpoint } from '../types';
import { ApiClient } from '../utils/apiClient';

interface EndpointDiscoveryProps {
  apiClient: ApiClient;
  onEndpointSelected: (endpoint: ApiEndpoint) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export const EndpointDiscovery: React.FC<EndpointDiscoveryProps> = ({
  apiClient,
  onEndpointSelected,
  onError,
  disabled
}) => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    discoverEndpoints();
  }, [apiClient]);

  const discoverEndpoints = async () => {
    setIsDiscovering(true);
    setError('');

    try {
      const discoveredEndpoints = await apiClient.discoverEndpoints();
      setEndpoints(discoveredEndpoints);
      
      if (discoveredEndpoints.length === 0) {
        setError('No endpoints were discovered. The API may not expose OpenAPI documentation.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to discover endpoints';
      setError(message);
      onError?.(message);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    onEndpointSelected(endpoint);
  };

  const toggleEndpointDetails = (endpointKey: string) => {
    setExpandedEndpoint(expandedEndpoint === endpointKey ? null : endpointKey);
  };

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">API Endpoints</h3>
          {isDiscovering && <Loader className="h-4 w-4 animate-spin text-blue-600" />}
        </div>

        {endpoints.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled}
              />
            </div>
          </div>
        )}

        {isDiscovering ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-600">Discovering API endpoints...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={discoverEndpoints}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : endpoints.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600">No endpoints discovered</p>
            <button
              onClick={discoverEndpoints}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Retry discovery
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEndpoints.map((endpoint, index) => {
              const endpointKey = `${endpoint.method}-${endpoint.path}`;
              const isExpanded = expandedEndpoint === endpointKey;
              const isSelected = selectedEndpoint?.path === endpoint.path && 
                               selectedEndpoint?.method === endpoint.method;

              return (
                <div
                  key={index}
                  className={`border rounded-lg transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => !disabled && handleEndpointSelect(endpoint)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {endpoint.path}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {endpoint.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEndpointDetails(endpointKey);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Full URL</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                            {endpoint.fullUrl}
                          </code>
                        </div>

                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Parameters</p>
                            <div className="space-y-1">
                              {endpoint.parameters.map((param, paramIndex) => (
                                <div key={paramIndex} className="text-xs">
                                  <span className={`inline-block px-1 py-0.5 rounded mr-2 ${
                                    param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {param.name}
                                  </span>
                                  <span className="text-gray-600">
                                    {param.type}{param.format && ` (${param.format})`}
                                    {param.required && ' *'}
                                  </span>
                                  {param.description && (
                                    <p className="text-gray-500 ml-2 mt-0.5">{param.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {endpoint.requestBody && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Request Body</p>
                            <div className="text-xs space-y-1">
                              <p className="text-gray-600">Content-Type: {endpoint.requestBody.contentType}</p>
                              {endpoint.requestBody.schema.properties && (
                                <div className="space-y-1">
                                  {Object.entries(endpoint.requestBody.schema.properties).map(([name, field]) => (
                                    <div key={name}>
                                      <span className={`inline-block px-1 py-0.5 rounded mr-2 ${
                                        field.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {name}
                                      </span>
                                      <span className="text-gray-600">
                                        {field.type}{field.format && ` (${field.format})`}
                                        {field.required && ' *'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEndpoint && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Selected: {selectedEndpoint.method} {selectedEndpoint.path}
              </p>
              <p className="text-xs text-green-600">Ready to proceed with data mapping</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};