import { ApiCredentials, ApiEndpoint, ApiParameter, ApiSchema } from '../types';

export class ApiClient {
  private credentials: ApiCredentials;
  private authHeader: string;

  constructor(credentials: ApiCredentials) {
    this.credentials = credentials;
    this.authHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return response;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest(this.credentials.baseUrl);

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }

  async discoverEndpoints(): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    
    // Try common OpenAPI/Swagger endpoints
    const swaggerUrls = [
      `${this.credentials.baseUrl}/swagger.json`,
      `${this.credentials.baseUrl}/api-docs`,
      `${this.credentials.baseUrl}/openapi.json`,
      `${this.credentials.baseUrl}/v2/api-docs`,
      `${this.credentials.baseUrl}/swagger/v1/swagger.json`
    ];

    for (const url of swaggerUrls) {
      try {
        const response = await this.makeRequest(url);
        if (response.ok) {
          const spec = await response.json();
          return this.parseOpenApiSpec(spec);
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error);
      }
    }

    // If no OpenAPI spec found, try to discover endpoints manually
    return this.discoverEndpointsManually();
  }

  private parseOpenApiSpec(spec: any): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const basePath = spec.basePath || '';
    
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, pathObj]: [string, any]) => {
        Object.entries(pathObj).forEach(([method, methodObj]: [string, any]) => {
          if (['get', 'post', 'put', 'delete'].includes(method.toLowerCase())) {
            const parameters = this.parseParameters(methodObj.parameters || []);
            const requestBody = methodObj.requestBody ? 
              this.parseRequestBody(methodObj.requestBody) : undefined;

            endpoints.push({
              method: method.toUpperCase() as any,
              path: basePath + path,
              fullUrl: this.credentials.baseUrl + basePath + path,
              description: methodObj.summary || methodObj.description || `${method.toUpperCase()} ${path}`,
              parameters,
              requestBody
            });
          }
        });
      });
    }

    return endpoints;
  }

  private parseParameters(parameters: any[]): ApiParameter[] {
    return parameters.map(param => ({
      name: param.name,
      type: param.schema?.type || param.type || 'string',
      required: param.required || false,
      description: param.description,
      format: param.schema?.format || param.format,
      enum: param.schema?.enum || param.enum,
      maxLength: param.schema?.maxLength || param.maxLength,
      minLength: param.schema?.minLength || param.minLength
    }));
  }

  private parseRequestBody(requestBody: any): any {
    const contentType = Object.keys(requestBody.content || {})[0] || 'application/json';
    const schema = requestBody.content?.[contentType]?.schema;
    
    if (schema) {
      return {
        contentType,
        schema: this.parseSchema(schema)
      };
    }
    
    return undefined;
  }

  private parseSchema(schema: any): ApiSchema {
    const properties: Record<string, ApiParameter> = {};
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([name, prop]: [string, any]) => {
        properties[name] = {
          name,
          type: prop.type || 'string',
          required: schema.required?.includes(name) || false,
          description: prop.description,
          format: prop.format,
          enum: prop.enum,
          maxLength: prop.maxLength,
          minLength: prop.minLength
        };
      });
    }

    return {
      type: schema.type || 'object',
      properties,
      required: schema.required || []
    };
  }

  private async discoverEndpointsManually(): Promise<ApiEndpoint[]> {
    // Common SAP API patterns
    const commonPaths = [
      '/api/v1',
      '/odata/v4',
      '/rest/v1',
      '/services',
      '/data'
    ];

    const endpoints: ApiEndpoint[] = [];

    for (const path of commonPaths) {
      try {
        const response = await this.makeRequest(`${this.credentials.baseUrl}${path}`, {
          method: 'OPTIONS'
        });
        
        if (response.ok) {
          // Parse allowed methods from response headers
          const allowHeader = response.headers.get('Allow') || '';
          const methods = allowHeader.split(',').map(m => m.trim().toUpperCase());
          
          methods.forEach(method => {
            if (['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
              endpoints.push({
                method: method as any,
                path,
                fullUrl: `${this.credentials.baseUrl}${path}`,
                description: `${method} endpoint at ${path}`,
                parameters: []
              });
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to discover endpoint ${path}:`, error);
      }
    }

    return endpoints;
  }

  async submitData(endpoint: ApiEndpoint, data: any): Promise<Response> {
    const url = endpoint.fullUrl;
    const method = endpoint.method;
    
    const options: RequestInit = {
      method,
      body: ['POST', 'PUT'].includes(method) ? JSON.stringify(data) : undefined
    };

    return this.makeRequest(url, options);
  }

  async verifyData(getEndpoint: string, identifier: string): Promise<Response> {
    const url = `${getEndpoint}/${identifier}`;
    return this.makeRequest(url);
  }
}