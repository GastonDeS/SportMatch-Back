import { Request, Response, NextFunction } from "express";
import EventsService from "../services/events.service";
import { HTTP_METHODS, HTTP_STATUS } from "../constants/http.constants";
import { HttpRequestInfo, JoiEnum, validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware";
import { autobind } from "core-decorators";
import Joi from "joi";
import { document } from "../utils/swaggerDocumentation/annotations";
import { SwaggerEndpointBuilder } from "../utils/swaggerDocumentation/SwaggerEndpointBuilder";
import { ParticipantStatus } from "../database/models/Participant.model";

@autobind
class EventsController {
    private readonly eventsService: EventsService;
    
    constructor() {
        this.eventsService = EventsService.getInstance();
    }

    
    @document(SwaggerEndpointBuilder.create()
        .responses({
            "200": {
                description: "OK",
                schema: {
                    type: "object",
                    properties: {
                        page: {
                            type: "number"
                        },
                        pageSize: {
                            type: "number"
                        },
                        items: {
                            type: "array",
                        }
                    }
                }
            }
        })
    .build())
    @validateQuery(Joi.object({
        participantId: Joi.number().min(1).optional(),
        sportId: Joi.alternatives([Joi.number().min(1).optional(), Joi.array().items(Joi.number().min(1).optional())]),
        userId: Joi.number().min(1).optional(),
        filterOut: Joi.boolean().optional(),
        location: Joi.alternatives([Joi.string().optional(), Joi.array().items(Joi.string().optional())]),
        expertise: Joi.string().optional(),
        schedule: Joi.string().optional(),
        date: Joi.string().optional(),
        page: Joi.number().min(0).optional(),
        limit: Joi.number().min(1).optional()
    }))
    @HttpRequestInfo("/events", HTTP_METHODS.GET)
    public async getEvents(req: Request, res: Response, next: NextFunction) {
        const queryFilters = req.query as Record<string, string>;
        const page = parseInt(queryFilters.page || "0");
        const limit = parseInt(queryFilters.limit || "20");
        
        try {
            const events = await this.eventsService.getEvents(queryFilters, page, limit);
            res.status(HTTP_STATUS.OK).send(events);
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
    @HttpRequestInfo("/events/{eventId}", HTTP_METHODS.GET)
    public async getEventById(req: Request, res: Response, next: NextFunction) {
        const eventId = req.params.eventId;

        try {
            const event = await this.eventsService.getEventById(eventId);
            res.status(HTTP_STATUS.OK).send(event);
        } catch (err) {
            next(err);
        }
    }

    // TODO: get owner id from validator
    @document(SwaggerEndpointBuilder.create()
        .responses({
            "201": {
                description: "Created",
                schema: {
                    type: "object",
                }
            }
        })
    .build())
    @validateBody(Joi.object({
        sportId: Joi.number().min(1).required(),
        expertise: Joi.number().required(),
        schedule: Joi.date().required(),
        location: Joi.string().required(),
        remaining: Joi.number().required(),
        duration: Joi.number().required(), // minutes
        description: Joi.string().optional()
    }))
    @HttpRequestInfo("/events", HTTP_METHODS.POST)
    public async createEvent(req: Request, res: Response, next: NextFunction) {
        const { sportId, expertise, description, schedule, duration, location, remaining } = req.body;
        const ownerId = req.user.id;

        try {
            const event = await this.eventsService.createEvent({
                ownerId, sportId, expertise, location, schedule, description, duration, remaining
            });
            res.status(HTTP_STATUS.CREATED).send({ event });
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
    @HttpRequestInfo("/events/:eventId/participants", HTTP_METHODS.PUT)
    public async addParticipant(req: Request, res: Response, next: NextFunction) {
        const participantId = req.user.id;
        const eventId = req.params.eventId;
        try {
            await this.eventsService.addParticipant(eventId, participantId);
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
    @HttpRequestInfo("/events/:eventId/participants", "delete")
    public async removeParticipant(req: Request, res: Response, next: NextFunction) {
        const participantId = req.user.id;
        const eventId = req.params.eventId;
        try {
            await this.eventsService.removeParticipant(eventId, participantId);
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
    @HttpRequestInfo("/events/:eventId/owner/participants", "delete")
    public async ownerRemoveParticipant(req: Request, res: Response, next: NextFunction) {
        const participantId = req.body.participantId;
        const ownerId = req.user.id;
        const eventId = req.params.eventId;
        try {
            await this.eventsService.removeParticipant(eventId, participantId, ownerId);
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
            await this.eventsService.acceptParticipant(eventId, participantId, ownerId);
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
    @HttpRequestInfo("/events/:eventId/owner/participants", HTTP_METHODS.GET)
    public async getParticipants(req: Request, res: Response, next: NextFunction) {
        const eventId = parseInt(req.params.eventId);
        const status = req.query.status ? req.query.status === ParticipantStatus.ACCEPTED : undefined;

        try {
            const participants = await this.eventsService.getParticipants(eventId, status);
            res.status(HTTP_STATUS.OK).send(participants);
        } catch (err) {
            next(err);
        }
    }

}

export default EventsController;