import { NextFunction, Request, Response } from "express";
import UsersService from "../services/user.service";
import { HTTP_METHODS, HTTP_STATUS } from "../constants/http.constants";
import { autobind } from "core-decorators";
import { HttpRequestInfo, validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware";
import Joi from "joi";
import { document } from "../utils/swaggerDocumentation/annotations";
import { SwaggerEndpointBuilder } from "../utils/swaggerDocumentation/SwaggerEndpointBuilder";
import AWSService from "../services/aws.service";


@autobind
class UsersController {
    private readonly usersService: UsersService;
    private readonly awsService: AWSService;

    constructor() {
        this.usersService = UsersService.getInstance();
        this.awsService = AWSService.getInstance();
    }

    @document(SwaggerEndpointBuilder.create()
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
    }))
    @HttpRequestInfo("/users", HTTP_METHODS.GET)
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

    @document(SwaggerEndpointBuilder.create()
        .responses({
            "201": {
                description: "created"
            }
        })
    .build())
    @validateBody(Joi.object({
        rater: Joi.string().required(),
        rating: Joi.number().min(1).max(5).required(),
        eventId: Joi.number().min(1).required()
    }))
    @validateParams(Joi.object({
        userId: Joi.number().min(1).required()
    }))
    @HttpRequestInfo("/users/:userId/rate", HTTP_METHODS.POST)
    public async rateUser(req: Request, res: Response, next: NextFunction) {
        const { rating, eventId } = req.body;
        const rater = req.user.email;
        const rated = req.params.userId;

        try {
            await this.usersService.rateUser(rated, rater, rating, eventId);
            res.status(HTTP_STATUS.CREATED).send();
        } catch (err) {
            next(err);
        }
    }

    @document(SwaggerEndpointBuilder.create()
        .responses({
            "200": {
                description: "OK",
            }
        })
        .build()
    )
    @HttpRequestInfo("/users", HTTP_METHODS.POST)
    public async createUser(req: Request, res: Response, next: NextFunction) {
        const { email, firstName, lastName, phoneNumber } = req.user;

        try {
            const user = await this.usersService.createUser(email, firstName, lastName, phoneNumber);
            res.status(HTTP_STATUS.OK).send(user);
        } catch (err) {
            next(err);
        }
    }


    @document(SwaggerEndpointBuilder.create()
        .responses({
            "200": {
                description: "OK",
            }
        })
        .build()
    )
    @validateParams(Joi.object({
        userId: Joi.number().min(1).required()
    }))
    @validateBody(Joi.object({
        phone_number: Joi.string().optional(),
        locations: Joi.array().items(Joi.string()).optional(),
        sports: Joi.array().items(Joi.number()).optional()
    }))
    @HttpRequestInfo("/users/:userId", HTTP_METHODS.PUT)
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        const { phone_number, locations, sports } = req.body;
        const email = req.user.email;

        try {
            const user = await this.usersService.updateUser(userId, email, phone_number, locations, sports);
            res.status(HTTP_STATUS.OK).send(user);
        } catch (err) {
            next(err);
        }
    }

    public async getUserImage(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        
        try {
            const presignedGetUrl = this.awsService.getPresignedGetUrl(`userid:${userId}`);
            res.status(HTTP_STATUS.OK).send({ presignedGetUrl });
        } catch (err) {
            next(err);
        }
    }

    public async updateUserImage(req: Request, res: Response, next: NextFunction) {
        const email = req.user.email;
        
        try {
            const user = await this.usersService.getUserByEmail(email);

            const presignedPutUrl = this.awsService.getPresignedPostUrl(`userid:${user.user_id}`);
            res.status(HTTP_STATUS.OK).send({ presignedPutUrl });
        } catch (err) {
            next(err);
        }
    }
}

export default UsersController;