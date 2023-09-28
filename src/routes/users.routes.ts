
import { Router } from 'express';
import { urlencoded } from 'body-parser';
import cors from 'cors';
import UsersController from '../controllers/users.controller';
import cognitoUserMiddleware from '../middlewares/cognitoUser.middleware';

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
        this.router.post('/', cognitoUserMiddleware, this.controller.createUser);
        this.router.post('/:userId/rate', cognitoUserMiddleware, this.controller.rateUser);
        this.router.put('/:userId', cognitoUserMiddleware, this.controller.updateUser);
    }
}
