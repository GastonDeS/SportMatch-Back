import { NextFunction, Request, Response } from 'express'
import GenericException from '../exceptions/generic.exception'
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID } from '../constants/auth.constants';


// This middleware should authenticate a company and attach companyInfo on request
const cognitoUserMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // We get the company api key from header
    const cognitoToken = req.header('c-api-key');
    if (!cognitoToken) return next(new GenericException({message: 'Missing cognito token', status: 401, internalStatus: "MISSING_COGNITO_TOKEN"}));

    try {
        // Verifier that expects valid access tokens:
        const verifier = CognitoJwtVerifier.create({
            userPoolId: COGNITO_USER_POOL_ID,
            tokenUse: "id", // access | id for now only id
            clientId: COGNITO_CLIENT_ID,
        });
        const payload = await verifier.verify(cognitoToken);
        
        const user = { 
            phoneNumber: payload.phone_number?.toString() ?? "",
            lastName: payload.family_name?.toString() ?? "",
            firstName: payload.given_name?.toString() ?? "",
            email: payload.email?.toString() ?? "",
        };
        if (!user.email || !user.firstName || !user.lastName || !user.phoneNumber)
            throw new GenericException({message: 'Missing cognito token', status: 401, internalStatus: "MISSING_COGNITO_TOKEN"});
        req.user = user;

        next();

    } catch (err) {
        next(err);
        console.log(err);
    }
}

export default cognitoUserMiddleware;
