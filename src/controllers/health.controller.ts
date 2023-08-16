import { RequestHandler } from 'express';
import { HTTP_STATUS } from '../constants/http.constants';

export default class HealthController {
    public healthCheck: RequestHandler = async(req, res, next) => {
        res.status(HTTP_STATUS.OK).send();
    };
}
