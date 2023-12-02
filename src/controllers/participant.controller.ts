import { autobind } from "core-decorators";
import ParticipantService from "../services/participant.service";
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { HTTP_METHODS, HTTP_STATUS } from "../constants/http.constants";
import { ParticipantStatus } from "../database/models/Participant.model";
import { validateParams, HttpRequestInfo, validateBody, validateQuery, JoiEnum } from "../middlewares/validation.middleware";
import { SwaggerEndpointBuilder } from "../utils/swaggerDocumentation/SwaggerEndpointBuilder";
import { document } from "../utils/swaggerDocumentation/annotations";


@autobind
export default class ParticipantController {
    private readonly participantService: ParticipantService;

    constructor() {
        this.participantService = ParticipantService.getInstance();
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
    @validateParams(Joi.object({
        eventId: Joi.number().min(1).required()
    }))
    @HttpRequestInfo("/events/:eventId/participants", HTTP_METHODS.PUT)
    public async addParticipant(req: Request, res: Response, next: NextFunction) {
        const participantId = req.user.id;
        const eventId = req.params.eventId;
        try {
            await this.participantService.addParticipant(eventId, participantId);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
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
    @validateParams(Joi.object({
        eventId: Joi.number().min(1).required()
    }))
    @HttpRequestInfo("/events/:eventId/participants", HTTP_METHODS.DELETE)
    public async removeParticipant(req: Request, res: Response, next: NextFunction) {
        const participantId = req.user.id;
        const eventId = req.params.eventId;
        try {
            await this.participantService.removeParticipant(eventId, participantId);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
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
    @validateParams(Joi.object({
        eventId: Joi.number().min(1).required()
    }))
    @validateBody(Joi.object({
        participantId: Joi.number().required(),
    }))
    @HttpRequestInfo("/events/:eventId/owner/participants", HTTP_METHODS.DELETE)
    public async ownerRemoveParticipant(req: Request, res: Response, next: NextFunction) {
        const participantId = req.body.participantId;
        const ownerId = req.user.id;
        const eventId = req.params.eventId;
        try {
            await this.participantService.removeParticipant(eventId, participantId, ownerId);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
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
    @validateParams(Joi.object({
        eventId: Joi.number().min(1).required()
    }))
    @validateBody(Joi.object({
        participantId: Joi.number().required(),
    }))
    @HttpRequestInfo("/events/:eventId/owner/participants", HTTP_METHODS.PUT)
    public async acceptParticipant(req: Request, res: Response, next: NextFunction) {
        const participantId = req.body.participantId;
        const ownerId = req.user.id;
        const eventId = parseInt(req.params.eventId);

        try {
            await this.participantService.acceptParticipant(eventId, participantId, ownerId);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
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
    @validateParams(Joi.object({
        eventId: Joi.number().min(1).required()
    }))
    @validateQuery(Joi.object({
        status: JoiEnum(ParticipantStatus).optional()
    }))
    @HttpRequestInfo("/events/:eventId/participants/owner", HTTP_METHODS.GET)
    public async getParticipants(req: Request, res: Response, next: NextFunction) {
        const eventId = parseInt(req.params.eventId);
        const status = req.query.status ? req.query.status === ParticipantStatus.ACCEPTED : undefined;

        try {
            const participants = await this.participantService.getParticipants(eventId, status);
            res.status(HTTP_STATUS.OK).send(participants);
        } catch (err) {
            next(err);
        }
    }
}