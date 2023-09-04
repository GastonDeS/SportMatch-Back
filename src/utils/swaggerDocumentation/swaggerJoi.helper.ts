import Joi from "joi";
import { HTTP_PARAMETERS } from "../../constants/http.constants";

export function translateExpressToSwaggerHttpParameters(source: HTTP_PARAMETERS) {
  if (source === HTTP_PARAMETERS.PATH) return HTTP_PARAMETERS.PATH;
  return source;
}

// Translate Joi schema to Swagger parameter definitions
export function translateJoiToSwagger(joiSchema: Joi.ObjectSchema, source: HTTP_PARAMETERS): any[] {
  const swaggerParameters: any[] = [];

  if (source === HTTP_PARAMETERS.BODY) {
    const bodySchema: any = {
      type: 'object',
      properties: {},
      required: [],
    };

    Object.keys(joiSchema.describe().keys).forEach((key: any) => {
      const joiParameter: Joi.Schema<any> = joiSchema.extract(key);
      const flags = joiParameter.describe().flags as any;

      const type = joiParameter.describe().type;

      // Map Joi types to Swagger types
      if (type === 'string') {
        bodySchema.properties[key] = { type: 'string' };
      } else if (type === 'number') {
        bodySchema.properties[key] = { type: 'number' };
      } else if (type === 'boolean') {
        bodySchema.properties[key] = { type: 'boolean' };
      } // Add more type mappings as needed

      const valids = joiParameter.describe().valids;
      // Translate constraints (e.g., min, max) to Swagger attributes (e.g., minimum, maximum)
      if (valids?.includes(null)) {
        bodySchema.properties[key].nullable = true;
      }
      if (valids?.includes(undefined)) {
        bodySchema.properties[key].nullable = true;
      }

      const tests = joiParameter.describe().tests;
      if (tests) {
        tests.forEach((test: any) => {
          if (test.name === 'min') {
            bodySchema.properties[key].minimum = test.args.limit;
          }
          if (test.name === 'max') {
            bodySchema.properties[key].maximum = test.args.limit;
          }
        });
      }

      if (flags.presence === 'required') {
        bodySchema.required.push(key);
      }
    });

    swaggerParameters.push({
      name: 'body',
      in: 'body',
      required: true,
      schema: bodySchema,
    });
  } else {
    Object.keys(joiSchema.describe().keys).forEach((key: any) => {
      const joiParameter: Joi.Schema<any> = joiSchema.extract(key);
      const flags = joiParameter.describe().flags as any;

      const swaggerParameter: any = {
        name: key,
        in: source, // or 'path', 'header', 'cookie', etc., depending on the use case
        description: joiParameter.describe().description,
        required: source === HTTP_PARAMETERS.PATH || flags.presence === 'required',
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
  }

  return swaggerParameters;
}
