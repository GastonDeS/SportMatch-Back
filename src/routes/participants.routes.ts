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

        this.router.post('/', userAuthMiddleware, this.controller.addParticipant);
        this.router.get('/', this.controller.getParticipants);

        this.router.delete('/:participantId', userAuthMiddleware, this.controller.removeParticipant);
        this.router.put('/:participantId', userAuthMiddleware, this.controller.updateParticipant);
    }
}
