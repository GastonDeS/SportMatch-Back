import Joi from "joi";
import { ValidationSource } from "../../middlewares/validation.middleware";

// Translate Joi schema to Swagger parameter definitions
export function translateJoiToSwagger(joiSchema: Joi.ObjectSchema, source: ValidationSource): any[] {
    const swaggerParameters: any[] = [];
  
    Object.keys(joiSchema.describe().keys).forEach((key: any) => {
      const joiParameter: Joi.Schema<any> = joiSchema.extract(key);
      const flags = joiParameter.describe().flags as any;
  
      const swaggerParameter: any = {
        name: key,
        in: source, // or 'path', 'header', 'cookie', etc., depending on the use case
        description: joiParameter.describe().description,
        required: flags.presence === 'required',
      };
  
      const type = joiParameter.describe().type;
  
      // Map Joi types to Swagger types
      if (type === 'string') {
        swaggerParameter.type = 'string';
      } else if (type === 'number') {
        swaggerParameter.type = 'number';
      } else if (type === 'boolean') {
        swaggerParameter.type = 'boolean';
      } // Add more type mappings as needed
  
      const valids = joiParameter.describe().valids;
      // Translate constraints (e.g., min, max) to Swagger attributes (e.g., minimum, maximum)
      if (valids?.includes(null)) {
        swaggerParameter.nullable = true;
      }
      if (valids?.includes(undefined)) {
        swaggerParameter.nullable = true;
      }
  
      const tests = joiParameter.describe().tests;
      if (tests) {
        tests.forEach((test: any) => {
          if (test.name === 'min') {
            swaggerParameter.minimum = test.args.limit;
          }
          if (test.name === 'max') {
            swaggerParameter.maximum = test.args.limit;
          }
        });
      }
  
      swaggerParameters.push(swaggerParameter);
    });
  
    return swaggerParameters;
}