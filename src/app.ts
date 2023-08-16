import express, { Application } from 'express';
import cors from 'cors';

import ErrorHandlerMiddleware from './middlewares/errorHandler.middleware';
import HealthRoutes from './routes/health.routes';
import pool from './database/postgres.database';

class App {
    public app: Application;
    private readonly setBasicConfig: boolean;

    constructor(setBasicConfig = true) {
        this.app = express();
        this.setBasicConfig = setBasicConfig;

        this.configureExpress();

        this.initializeDatabases();

        this.initializeServices();

        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private configureExpress(): void {
        if (this.setBasicConfig) {
            this.app.use(express.json({ limit: '50mb' }));
            this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
            this.app.use(cors());
        }

        this.app.set('trust proxy', 1);
    }

    private initializeDatabases(): void {
        if (process.env.DB_URL) {
            try {
                
            } catch (err) {
                console.log(err);
            }
        }
    }

    // TODO: Organize the services by categories so it's not a mess
    private initializeServices(): void {
    }

    private initializeRoutes(): void {
        this.app.use('/', new HealthRoutes().router);

        test().then(() => {
            console.log("Connected to DB");
        }).catch((err) => {
            console.log(err);
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(ErrorHandlerMiddleware);
    }
}

const test = async (): Promise<void> => {
    await pool.query("select * from users");
}

export default new App().app;
