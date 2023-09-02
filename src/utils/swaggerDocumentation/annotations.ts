import { SwaggerEndpoint } from './swagger.interface';
import { SwaggerBuilder } from './swaggerBuilder';

export function document(swaggerEndpoint: SwaggerEndpoint) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // You can access the SwaggerBuilder instance here
    const builder = SwaggerBuilder.getInstance();
    
    // You can save or process the Swagger documentation as needed
    // For example, you can store it in a global variable or file
    // Or you can integrate it with a Swagger documentation generator
    const swaggerDocumentation = builder.build();

    // Do something with swaggerDocumentation
  };
}
