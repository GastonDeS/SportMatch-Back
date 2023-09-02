import { Request, Response, NextFunction } from "express";
import EventsService from "../services/events.service";
import { HTTP_STATUS } from "../constants/http.constants";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware";
import { autobind } from "core-decorators";
import Joi from "joi";
import { document } from "../utils/swaggerDocumentation/annotations";
import { SwaggerEndpointBuilder } from "../utils/swaggerDocumentation/SwaggerEndpointBuilder";
import { SwaggerBuilder } from "../utils/swaggerDocumentation/swaggerBuilder";
import { SwaggerParameterBuilder } from "../utils/swaggerDocumentation/swaggerParameterbuilder";

@autobind
class EventsController {
    private readonly eventsService: EventsService;
    
    constructor() {
        this.eventsService = EventsService.getInstance();
    }

    
    @document(SwaggerBuilder.getInstance().path("/events", "get")
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
        participantId: Joi.string().optional(),
        sportId: Joi.string().optional(),
        userId: Joi.string().optional(),
        filterOut: Joi.boolean().optional(),
        location: Joi.string().optional(),
        expertise: Joi.string().optional(),
        schedule: Joi.string().optional(),
        date: Joi.string().optional(),
    }), "/events", "get")
    public async getEvents(req: Request, res: Response, next: NextFunction) {
        const queryFilters = req.query as Record<string, string>;
        
        try {
            const events = await this.eventsService.getEvents(queryFilters);
            res.status(HTTP_STATUS.OK).send(events);
        } catch (err) {
            next(err);
        }
    }

    @document(SwaggerBuilder.getInstance().path("/events/{eventId}", "get")
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
        eventId: Joi.number().required()
    }), "/events/{eventId}", "get")
    public async getEventById(req: Request, res: Response, next: NextFunction) {
        const eventId = parseInt(req.params.eventId);

        try {
            const event = await this.eventsService.getEventById(eventId);
            res.status(HTTP_STATUS.OK).send(event);
        } catch (err) {
            next(err);
        }
    }

    // TODO: get owner id from validator
    @document(SwaggerBuilder.getInstance().path("/events", "post")
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
        owner_id: Joi.number().required(),
        sport_id: Joi.number().required(),
        expertise: Joi.string().required(),
        schedule: Joi.date().required(),
        location: Joi.string().required(),
        remaining: Joi.number().required(),
        description: Joi.string().optional()
    }), "/events", "post")
    public async createEvent(req: Request, res: Response, next: NextFunction) {
        const { owner_id, sport_id, expertise, description, schedule, location, remaining } = req.body;

        try {
            const event = await this.eventsService.createEvent(owner_id, sport_id, expertise, location, schedule, description, remaining);
            res.status(HTTP_STATUS.CREATED).send({eventId: event});
        } catch (err) {
            next(err);
        }
    }

    @document(SwaggerBuilder.getInstance().path("/events/:eventId/participants", "put")
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
        eventId: Joi.number().required()
    }), "/events/:eventId/participants", "put")
    @validateBody(Joi.object({
        userId: Joi.number().required()
    }), "/events/:eventId/participants", "put")
    public async addParticipant(req: Request, res: Response, next: NextFunction) {
        const userId = req.body.userId; // TODO get this from validator
        const eventId = parseInt(req.params.eventId);
        try {
            await this.eventsService.addParticipant(eventId, userId);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
    }


    @document(SwaggerBuilder.getInstance().path("/events/:eventId/participants", "delete")
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
        eventId: Joi.number().required()
    }), "/events/:eventId/participants", "delete")
    @validateBody(Joi.object({
        userId: Joi.number().required()
    }), "/events/:eventId/participants", "delete")
    public async removeParticipant(req: Request, res: Response, next: NextFunction) {
        const userId = req.body.userId; // TODO get this from validator
        const eventId = parseInt(req.params.eventId);
        try {
            await this.eventsService.removeParticipant(eventId, userId);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
    }

    /**
     * TODO: this route need owner validation
     */
    @document(SwaggerBuilder.getInstance().path("/events/:eventId/owner/participants", "put")
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
        eventId: Joi.number().required()
    }), "/events/:eventId/owner/participants", "put")
    @validateBody(Joi.object({
        userId: Joi.number().required()
    }), "/events/:eventId/owner/participants", "put")
    public async acceptParticipant(req: Request, res: Response, next: NextFunction) {
        const userId = req.body.userId;
        const eventId = parseInt(req.params.eventId);

        try {
            await this.eventsService.acceptParticipant(eventId, userId);
            res.status(HTTP_STATUS.OK).send();
        } catch (err) {
            next(err);
        }
    }

    @document(SwaggerBuilder.getInstance().path("/events/:eventId/owner/participants", "get")
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
        eventId: Joi.number().required()
    }), "/events/:eventId/owner/participants", "get")
    public async getParticipants(req: Request, res: Response, next: NextFunction) {
        const eventId = parseInt(req.params.eventId);

        try {
            const participants = await this.eventsService.getParticipants(eventId);
            res.status(HTTP_STATUS.OK).send(participants);
        } catch (err) {
            next(err);
        }
    }

}

export default EventsController;