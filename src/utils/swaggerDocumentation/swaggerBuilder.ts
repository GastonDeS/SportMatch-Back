import { SwaggerEndpointBuilder } from './SwaggerEndpointBuilder';

export class SwaggerBuilder {
  private static instance: SwaggerBuilder | null = null; // Singleton instance
  private paths: { [key: string]: any } = {};

  private constructor() {} // Private constructor to prevent external instantiation

  // Method to get or create the singleton instance
  public static getInstance(): SwaggerBuilder {
    if (!SwaggerBuilder.instance) {
      SwaggerBuilder.instance = new SwaggerBuilder();
    }
    return SwaggerBuilder.instance;
  }

  // Create and return a new SwaggerEndpointBuilder for a specific path
  path(path: string) {
    if (!this.paths[path]) {
      this.paths[path] = {};
    }
    return new SwaggerEndpointBuilder(this.paths[path]);
  }

  // Build the entire Swagger documentation object
  build(): { [key: string]: any } {
    return {
      ...this.paths,
    };
  }
}
