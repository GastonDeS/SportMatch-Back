import { NextFunction, Request, Response } from "express";
import UsersService from "../services/user.service";
import { HTTP_STATUS } from "../constants/http.constants";


class UsersController {
    private readonly usersService: UsersService;

    constructor() {
        this.usersService = UsersService.getInstance();

        this.getUsers = this.getUsers.bind(this);
        this.getUserByEmail = this.getUserByEmail.bind(this);
    }

    public async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.usersService.getUsers();
            res.status(HTTP_STATUS.OK).send(users);
        } catch (err) {
            next(err);
        }
    }

    public async getUserByEmail(req: Request, res: Response, next: NextFunction) {
        const email = req.params.email;

        try {
            const user = await this.usersService.getUserByEmail(email);
            res.status(HTTP_STATUS.OK).send(user);
        } catch (err) {
            next(err);
        }
    }

}

export default UsersController;