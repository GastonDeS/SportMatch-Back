import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import GenericException from '../exceptions/generic.exception';
import { SwaggerBuilder } from '../utils/swaggerDocumentation/swaggerBuilder';
import { translateJoiToSwagger } from '../utils/swaggerDocumentation/swaggerJoi.helper';

// this function is weird because of the way the enum is defined in typescript
export const JoiEnum = (enumObject: any) => {
    const enumValues = Object.values(enumObject);
    if (enumValues[0] !== enumObject[enumValues[0] as any])
        return Joi.object().valid(...enumValues.splice(enumValues.length / 2));
    return Joi.object().valid(...enumValues);
}

type validateType = (schema: Joi.ObjectSchema, path?: string, method?: string) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void

export const validateQuery: validateType = (schema, path, method) => {
    return validationHelper(schema, ValidationSource.QUERY, path, method);
};

export const validateBody: validateType = (schema, path, method) => {
    return validationHelper(schema, ValidationSource.BODY, path, method);
};

export const validateParams: validateType = (schema, path, method) => {
    return validationHelper(schema, ValidationSource.PARAM, path, method);
};

export enum ValidationSource {
    BODY = 'body',
    QUERY = 'query',
    PARAM = 'params',
}

const validationHelper = (schema: Joi.ObjectSchema, source: ValidationSource, path?: string, method?: string) => {
    if (path) SwaggerBuilder.getInstance().path(path, method ?? "get").parameters(translateJoiToSwagger(schema, source)).build();
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function async (req: Request, res: Response, next: NextFunction) {
            const { error } = schema.validate(req[source]);
            if (error) {
                next(new GenericException({ 
                    message: error.details.map((e: any) => e.message.replace(/"/g, '')).join(', '),
                    status: 400,
                    internalStatus: "BAD_REQUEST"
                }));
            } else {
                originalMethod.apply(this, [req, res, next]);
            }
        };
    };
}