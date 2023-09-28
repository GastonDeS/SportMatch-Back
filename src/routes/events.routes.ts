
import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import EventsController from '../controllers/events.controller';
import cognitoUserMiddleware from '../middlewares/cognitoUser.middleware';

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
        this.router.put('/:eventId/participants', cognitoUserMiddleware, this.controller.addParticipant);
        this.router.delete('/:eventId/participants', cognitoUserMiddleware, this.controller.removeParticipant);
        this.router.put('/:eventId/owner/participants', cognitoUserMiddleware, this.controller.acceptParticipant); 
        this.router.get('/:eventId/owner/participants', this.controller.getParticipants);
        this.router.delete('/:eventId/owner/participants', cognitoUserMiddleware, this.controller.ownerRemoveParticipant);

        this.router.post('/', cognitoUserMiddleware, this.controller.createEvent);
    }
}
