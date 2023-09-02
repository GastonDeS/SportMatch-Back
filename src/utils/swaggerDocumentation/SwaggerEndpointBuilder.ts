import { SwaggerEndpoint, SwaggerParameter, SwaggerResponse } from "./swagger.interface";

export class SwaggerEndpointBuilder {
    private endpoint: SwaggerEndpoint;
  
    constructor(private pathObject: { [key: string]: SwaggerEndpoint }) {
      this.endpoint = {};
    }

    summary(summary: string): this {
      this.endpoint.summary = summary;
      return this;
    }
  
    description(description: string): this {
      this.endpoint.description = description;
      return this;
    }
  
    tags(tags: string[]): this {
      this.endpoint.tags = tags;
      return this;
    }
  
    parameters(parameters: SwaggerParameter[]): this {
      this.endpoint.parameters = parameters;
      return this;
    }
  
    responses(responses: { [key: string]: SwaggerResponse }): this {
      this.endpoint.responses = responses;
      return this;
    }
  
    build() {
        return (this.pathObject['get'] = this.endpoint);
    }
  }
  