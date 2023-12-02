import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import userAuthMiddleware from '../middlewares/jwt.middleware';
import ParticipantController from '../controllers/participant.controller';

export default class ParticipantsRoutes {
    public router: Router = Router({ mergeParams: true });
    private readonly controller: ParticipantController = new ParticipantController();

    constructor() {
        this.init();
    }

    public init(): void {
        this.router.use(urlencoded({ extended: true }));
        this.router.use(cors());

        this.router.put('/', userAuthMiddleware, this.controller.addParticipant);

        this.router.delete('/', userAuthMiddleware, this.controller.removeParticipant);
        this.router.put('/owner', userAuthMiddleware, this.controller.acceptParticipant);

        this.router.get('/owner', this.controller.getParticipants);
        this.router.delete('/owner', userAuthMiddleware, this.controller.ownerRemoveParticipant);
    }
}
