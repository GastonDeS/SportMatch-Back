import { SwaggerEndpoint, SwaggerParameter, SwaggerResponse } from "./swagger.interface";

export class SwaggerEndpointBuilder {
    private endpoint: SwaggerEndpoint;
  
    constructor(private pathObject: SwaggerEndpoint) {
      this.endpoint = pathObject;
    }

    summary(summary: string): this {
      this.endpoint.summary = summary;
      return this;
    }
  
    description(description: string): this {
      this.endpoint.description = description;
      return this;
    }
  
    // tags(tags: string[]): this {
    //   (this.endpoint.tags ?? []).push(...tags);
    //   return this;
    // }
  
    parameters(parameters: SwaggerParameter[]): this {
      if (this.endpoint.parameters === undefined) this.endpoint.parameters = [];
      parameters.forEach((parameter) => this.endpoint.parameters?.push(parameter));
      return this;
    }
  
    responses(responses: { [key: string]: SwaggerResponse }): this {
      console.log("this.endpoint.responses1", this.endpoint.responses);
      this.endpoint.responses = responses;
      console.log("this.endpoint.responses2", this.endpoint.responses);
      return this;
    }
  
    build() {
      console.log("endpoint", this.endpoint);
      if (this.endpoint.responses === undefined) this.endpoint.responses = {};
      this.endpoint.responses["400"] = {
        description: "Bad Request",
        schema: {
          $ref: "#/components/schemas/IErrorData",
        },
      };
      return (this.pathObject = this.endpoint);
    }
  }
  