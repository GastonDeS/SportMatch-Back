
import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import EventsController from '../controllers/events.controller';

export default class EventsRoutes {
    public router: Router = Router({ mergeParams: true });
    private readonly controller: EventsController = new EventsController();

    constructor() {
        this.init();
    }

    public init(): void {
        this.router.use(urlencoded({ extended: true }));
        this.router.use(cors());

        this.router.get('/', this.controller.getEvents);
        this.router.get('/:eventId', this.controller.getEventById);
        this.router.put('/:eventId/participants', this.controller.addParticipant);
        this.router.put('/:eventId/owner/participants', this.controller.acceptParticipant);
        this.router.get('/:eventId/owner/participants', this.controller.getParticipants);

        this.router.post('/', this.controller.createEvent);
    }
}
