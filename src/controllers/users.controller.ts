import { NextFunction, Request, Response } from "express";
import UsersService from "../services/user.service";
import { HTTP_STATUS } from "../constants/http.constants";
import { autobind } from "core-decorators";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware";
import Joi from "joi";
import { document } from "../utils/swaggerDocumentation/annotations";
import { SwaggerBuilder } from "../utils/swaggerDocumentation/swaggerBuilder";


@autobind
class UsersController {
    private readonly usersService: UsersService;

    constructor() {
        this.usersService = UsersService.getInstance();
    }

    @document(SwaggerBuilder.getInstance().path("/users", "get")
        .responses({
            "200": {
                description: "OK",
                schema: {
                    type: "object",
                }
            }
        })
    .build())
    @validateQuery(Joi.object({
        email: Joi.string().email().optional(),
    }), "/users", "get")
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

    @document(SwaggerBuilder.getInstance().path("/users/:userId/rate", "post")
        .responses({
            "201": {
                description: "created"
            }
        })
    .build())
    @validateBody(Joi.object({
        rater: Joi.string().required(),
        rating: Joi.number().required(),
        eventId: Joi.number().required()
    }), "/users/:userId/rate", "post")
    @validateParams(Joi.object({
        rated: Joi.string().required()
    }), "/users/:userId/rate", "post")
    public async rateUser(req: Request, res: Response, next: NextFunction) {
        const { rater, rating, eventId } = req.body;
        const rated = req.params.rated;

        try {
            await this.usersService.rateUser(rated, rater, rating, eventId);
            res.status(HTTP_STATUS.CREATED).send();
        } catch (err) {
            next(err);
        }
    }

    @document(SwaggerBuilder.getInstance().path("/users", "post")
        .responses({
            "200": {
                description: "OK",
            }
        })
        .build()
    )
    @validateBody(Joi.object({
        email: Joi.string().email().required(),
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        phone_number: Joi.string().required()
    }), "/users", "post")
    public async createUser(req: Request, res: Response, next: NextFunction) {
        const { email, firstname, lastname, phone_number } = req.body;

        try {
            const user = await this.usersService.createUser(email, firstname, lastname, phone_number);
            res.status(HTTP_STATUS.OK).send(user);
        } catch (err) {
            next(err);
        }
    }


    @document(SwaggerBuilder.getInstance().path("/users/:userId", "put")
        .responses({
            "200": {
                description: "OK",
            }
        })
        .build()
    )
    @validateParams(Joi.object({
        userId: Joi.string().required()
    }), "/users/:userId", "put")
    @validateBody(Joi.object({
        phone_number: Joi.string().optional(),
        locations: Joi.array().items(Joi.string()).optional(),
        sports: Joi.array().items(Joi.string()).optional()
    }), "/users/:userId", "put")
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        const { phone_number, locations, sports } = req.body;

        try {
            const user = await this.usersService.updateUser(userId, phone_number, locations, sports);
            res.status(HTTP_STATUS.OK).send(user);
        } catch (err) {
            next(err);
        }
    }

}

export default UsersController;