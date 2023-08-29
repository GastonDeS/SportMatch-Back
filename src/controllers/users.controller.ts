import { NextFunction, Request, Response } from "express";
import UsersService from "../services/user.service";
import { HTTP_STATUS } from "../constants/http.constants";
import { autobind } from "core-decorators";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware";
import Joi from "joi";


@autobind
class UsersController {
    private readonly usersService: UsersService;

    constructor() {
        this.usersService = UsersService.getInstance();
    }

    @validateQuery(Joi.object({
        email: Joi.string().email().optional(),
    }))
    public async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            if (req.query.email) {
                const user = await this.usersService.getUserByEmail(req.query.email as string);
                res.status(HTTP_STATUS.OK).send(user);
            } else {
                const users = await this.usersService.getUsers();
                res.status(HTTP_STATUS.OK).send(users);
            }
        } catch (err) {
            next(err);
        }
    }

    @validateBody(Joi.object({
        email: Joi.string().email().required(),
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        telephone: Joi.string().required()
    }))
    public async createUser(req: Request, res: Response, next: NextFunction) {
        const { email, firstname, lastname, telephone } = req.body;

        try {
            const user = await this.usersService.createUser(email, firstname, lastname, telephone);
            res.status(HTTP_STATUS.OK).send(user);
        } catch (err) {
            next(err);
        }
    }


    @validateParams(Joi.object({
        userId: Joi.string().required()
    }))
    @validateBody(Joi.object({
        telephone: Joi.string().optional(),
        locations: Joi.array().items(Joi.string()).optional(),
        sports: Joi.array().items(Joi.string()).optional()
    }))
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        const { telephone, locations, sports } = req.body;

        try {
            const user = await this.usersService.updateUser(userId, telephone, locations, sports);
            res.status(HTTP_STATUS.OK).send(user);
        } catch (err) {
            next(err);
        }
    }

}

export default UsersController;