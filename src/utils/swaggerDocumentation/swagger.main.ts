import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { SwaggerBuilder } from './swaggerBuilder';


const swaggerAPI = {
    openapi: '3.0.0',
    info: {
        title: 'Sports Match App API',
        version: '1.0.0',
        description: 'Sports Match App API',
    },
    paths: SwaggerBuilder.getInstance().build()
};

console.log(JSON.stringify(swaggerAPI));
console.log("paths: ", swaggerAPI.paths);

function initializeSwagger(app: Application) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerAPI));

    app.get('/swagger.json', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerAPI);
    });
}

export default initializeSwagger;