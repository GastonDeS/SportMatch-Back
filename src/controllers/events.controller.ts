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

    
    @document(SwaggerBuilder.getInstance().path("/events")
        .parameters([
            SwaggerParameterBuilder.create("participantId").location("query").description("Participant id").required(false).type("string").build(),
            SwaggerParameterBuilder.create("sportId").location("query").description("Sport id").required(false).type("string").build(),
            SwaggerParameterBuilder.create("userId").location("query").description("User id").required(false).type("string").build(),
            SwaggerParameterBuilder.create("filterOut").location("query").description("Filter out").required(false).type("boolean").build(),
            SwaggerParameterBuilder.create("location").location("query").description("Location").required(false).type("string").build(),
            SwaggerParameterBuilder.create("expertise").location("query").description("Expertise").required(false).type("string").build(),
            SwaggerParameterBuilder.create("schedule").location("query").description("Schedule").required(false).type("string").build(),
            SwaggerParameterBuilder.create("date").location("query").description("Date").required(false).type("string").build()
        ])
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
    }))
    public async getEvents(req: Request, res: Response, next: NextFunction) {
        const queryFilters = req.query as Record<string, string>;
        
        console.log(queryFilters);
        try {
            const events = await this.eventsService.getEvents(queryFilters);
            console.log(events);
            res.status(HTTP_STATUS.OK).send(events);
        } catch (err) {
            next(err);
        }
    }

    @document(SwaggerBuilder.getInstance().path("/events/{eventId}")
        .parameters([
            SwaggerParameterBuilder.create("eventId").location("path").description("Event id").required(true).type("string").build()
        ])
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
    }))
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
    @validateBody(Joi.object({
        owner_id: Joi.number().required(),
        sport_id: Joi.number().required(),
        expertise: Joi.string().required(),
        schedule: Joi.date().required(),
        location: Joi.string().required(),
        remaining: Joi.number().required(),
        description: Joi.string().optional()
    }))
    public async createEvent(req: Request, res: Response, next: NextFunction) {
        const { owner_id, sport_id, expertise, description, schedule, location, remaining } = req.body;

        try {
            const event = await this.eventsService.createEvent(owner_id, sport_id, expertise, location, schedule, description, remaining);
            res.status(HTTP_STATUS.CREATED).send({eventId: event});
        } catch (err) {
            next(err);
        }
    }

    @validateParams(Joi.object({
        eventId: Joi.number().required()
    }))
    @validateBody(Joi.object({
        userId: Joi.number().required()
    }))
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

    @validateParams(Joi.object({
        eventId: Joi.number().required()
    }))
    @validateBody(Joi.object({
        userId: Joi.number().required()
    }))
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
    @validateParams(Joi.object({
        eventId: Joi.number().required()
    }))
    @validateBody(Joi.object({
        userId: Joi.number().required()
    }))
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

    @validateParams(Joi.object({
        eventId: Joi.number().required()
    }))
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