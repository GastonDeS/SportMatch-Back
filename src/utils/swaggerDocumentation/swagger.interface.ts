export interface SwaggerEndpoint {
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: SwaggerParameter[];
    responses?: { [statusCode: string]: SwaggerResponse };
  }
  
export interface SwaggerParameter {
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie' | 'body';
    description?: string;
    required: boolean;
    type: string;
    format?: string;
    // Add any other properties specific to parameters
}

export interface SwaggerResponse {
    description: string;
    schema?: any; // Define a more specific schema type if needed
    // Add any other properties specific to responses
}
  
