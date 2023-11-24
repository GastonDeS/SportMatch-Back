import { autobind } from "core-decorators";
import AuthService from "../services/auth.service";
import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants/http.constants";
import { HttpRequestInfo, validateBody } from "../middlewares/validation.middleware";
import Joi from "joi";


@autobind
class AuthController {
    private readonly authService: AuthService;

    constructor() {
        this.authService = AuthService.getInstance();
    }


    @validateBody(Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/).required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        birthdate: Joi.string().required(),
    }))
    @HttpRequestInfo("/auth", "POST")
    public async createAuth(req: Request, res: Response, next: NextFunction) {
        try {
            await this.authService.createAuth(req.body.email, req.body.password, req.body.firstName, req.body.lastName, req.body.phoneNumber, req.body.birthdate);
            res.status(HTTP_STATUS.CREATED).send();
        } catch (err) {
            next(err);
        }
    }

    @HttpRequestInfo("/auth", "GET")
    public async login(req: Request, res: Response, next: NextFunction) {
        try {
            const accessToken = await this.authService.login(req.userBasic.email, req.userBasic.password);
            res.header("c-api-key", accessToken);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
    }
}

export default AuthController;