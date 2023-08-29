
import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import UsersController from '../controllers/users.controller';

export default class UsersRoutes {
    public router: Router = Router({ mergeParams: true });
    private readonly controller: UsersController = new UsersController();

    constructor() {
        this.init();
    }

    public init(): void {
        this.router.use(urlencoded({ extended: true }));
        this.router.use(cors());

        this.router.get('/', this.controller.getUsers);
        this.router.post('/', this.controller.createUser);
        this.router.put('/:userId', this.controller.updateUser);
    }
}
