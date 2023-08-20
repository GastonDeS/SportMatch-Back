import { Request, Response, NextFunction } from "express";
import EventsService from "../services/events.service";
import { HTTP_STATUS } from "../constants/http.constants";


class EventsController {
    private readonly eventsService: EventsService;
    
    constructor() {
        this.eventsService = EventsService.getInstance();

        this.getEvents = this.getEvents.bind(this);
        this.getEventById = this.getEventById.bind(this);
        this.createEvent = this.createEvent.bind(this);
        this.addParticipant = this.addParticipant.bind(this);
        this.acceptParticipant = this.acceptParticipant.bind(this);
        this.getParticipants = this.getParticipants.bind(this);
    }

    public async getEvents(req: Request, res: Response, next: NextFunction) {
        const queryFilters = req.query as Record<string, string>;

        try {
            const events = await this.eventsService.getEvents(queryFilters);
            res.status(HTTP_STATUS.OK).send(events);
        } catch (err) {
            next(err);
        }
    }

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
    public async createEvent(req: Request, res: Response, next: NextFunction) {
        const { owner_id, sport_id, expertise, description, time, location, remaining } = req.body;

        try {
            const event = await this.eventsService.createEvent(owner_id, sport_id, expertise, description, time, location, remaining);
            res.status(HTTP_STATUS.CREATED).send(event);
        } catch (err) {
            next(err);
        }
    }

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

    /**
     * TODO: this route need validation
     */
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