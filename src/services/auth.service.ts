import UsersService from "./user.service";
import sequelize from "../database/connection";
import AuthPersistence from "../database/persistence/auth.persistence";
import * as jwt from 'jsonwebtoken';
import Crypto from "crypto";
import GenericException from "../exceptions/generic.exception";
import NotFoundException from "../exceptions/notFound.exception";
import Bluebird from "bluebird";
import UserPersistence from "../database/persistence/user.persistence";
import { ValidationErrorItem } from "sequelize";
import { HTTP_STATUS } from "../constants/http.constants";

class AuthService {
    private static instance: AuthService;
    private userService: UsersService;
    private jwtKey: string;
    private accessTokenExpireTime: string;

    static getInstance() {
        if (!AuthService.instance) AuthService.instance = new AuthService();
        return AuthService.instance;
    }

    private constructor() {
        this.accessTokenExpireTime = process.env.ACCESS_TOKEN_EXPIRE_TIME ?? '7600000';
        this.jwtKey = process.env.JWT_KEY ?? 'kvajfvhjabdsjhvajdhvjsvbsmn';
        this.userService = UsersService.getInstance();
    }

    async createAuth(email: string, password: string, firstName: string, lastName: string, phoneNumber: string, birthdate: string) {
        let transaction;
        try {
            transaction = await sequelize.transaction();

            const passwordHash = await hashPassword(password);

            const auth = await AuthPersistence.createAuth(email, passwordHash.toString(), transaction);

            const user = await this.userService.createUser(email, firstName, lastName, phoneNumber, birthdate, transaction);

            await transaction.commit();
        } catch (err) {
            console.log(err);
            if (transaction) await transaction.rollback();
            if (err.errors && err.errors[0]) {
                const error = err.errors[0] as ValidationErrorItem;
                if (error.type == 'unique violation') {
                    throw new GenericException({status: HTTP_STATUS.CONFLICT, message: `${error.path}`, internalStatus: "CONFLICT"});
                }
                throw new GenericException({status: HTTP_STATUS.BAD_REQUEST, message: error.message, internalStatus: "VALIDATION_ERROR"});
            }
            throw err;
        }
    }

    login = async (email: string, password: string) => {
        const userAuth = await AuthPersistence.getAuthByEmail(email);
        if (!userAuth) throw new NotFoundException('User');

        if (!validatePassword(password, userAuth.password!)) throw new NotFoundException('User');

        const user = await UserPersistence.getUserByEmail(email);
        if (!user) throw new NotFoundException('User');
        const userDetail = await UserPersistence.getUserDetailById(user.id.toString());

        const accessToken = this.signAccessToken(user.id.toString(), userAuth.email);
        return {userDetail, accessToken};
    }

    verifyToken = (token: string) : string | jwt.JwtPayload=> {

        try{
            const pubKey = this.jwtKey;
            return jwt.verify(token, pubKey);
        } catch(err){
            const error = err as any;
            if(error.name == 'TokenExpiredError') {
                throw {status: HTTP_STATUS.UNAUTHORIZED, message: "Expired token."};
            } else {
                throw {status: HTTP_STATUS.BAD_REQUEST, message: "Invalid token."};
            }
        }
    }

    private signAccessToken = (userId: string, email: string) : string => {
        return this.jwtSign(userId, email, this.accessTokenExpireTime);
    }

    private jwtSign = (userId: string, email: string, expiryTime: string) => {
        const payload = {id: userId, email: email};
        const key = this.jwtKey;
        return jwt.sign(payload, key, {issuer: 'byPS', expiresIn: expiryTime });
    }
}

export const pbkdf2 = Bluebird.promisify(Crypto.pbkdf2);
export const PBKDF2_HASH = process.env.PBKDF2_HASH ?? '';

export const validatePassword = async (maybePassword: string, passwordHash: string) => {
    const derKey: Buffer = await pbkdf2(maybePassword, PBKDF2_HASH, 1000, 32, 'sha512');
    console.log(derKey.toString());
    console.log(passwordHash);
    return derKey.toString() === passwordHash;
}

export const hashPassword = async (password: string) => {
    return await pbkdf2(password, PBKDF2_HASH, 1000, 32, 'sha512');
}

export default AuthService;