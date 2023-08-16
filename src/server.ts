import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';

app.listen(process.env.PORT ?? 8080, () => console.log(`${process.env.NAME!} up and running`));
