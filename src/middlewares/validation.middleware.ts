import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import GenericException from '../exceptions/generic.exception';

// this function is weird because of the way the enum is defined in typescript
export const JoiEnum = (enumObject: any) => {
    const enumValues = Object.values(enumObject);
    if (enumValues[0] !== enumObject[enumValues[0] as any])
        return Joi.object().valid(...enumValues.splice(enumValues.length / 2));
    return Joi.object().valid(...enumValues);
}

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return validationHelper(schema, ValidationSource.QUERY);
};

export const validateBody = (schema: Joi.ObjectSchema) => {
    return validationHelper(schema, ValidationSource.BODY);
};

export const validateParams = (schema: Joi.ObjectSchema) => {
    return validationHelper(schema, ValidationSource.PARAM);
};

enum ValidationSource {
    BODY = 'body',
    QUERY = 'query',
    PARAM = 'params',
}

const validationHelper = (schema: Joi.ObjectSchema, source: ValidationSource) => {
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