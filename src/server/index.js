import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compress from 'compression';
import servicesLoader from './services';
const services = servicesLoader(utils);
import db from './database';

const utils = {
    db,
}

const root = path.join(__dirname, '../../');

const app = express();
app.use(compress());
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "*.amazonaws.com"]
        }
    }));
    app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
}
app.use(cors());
app.use('/', express.static(path.join(root, 'dist/client')));
app.use('/uploads', express.static(path.join(root, 'uploads')));
app.get('/', (req, res) =>
{
    res.sendFile(path.join(root, '/dist/client/index.html'));
});
const serviceNames = Object.keys(services);

for (let i = 0; i < serviceNames.length; i += 1) {
    const name = serviceNames[i];
    if (name === 'graphql') {
        (async () =>
        {
            await services[name].start();
            services[name].applyMiddleware({ app });
        })();
    } else {
        app.use(`/${name}`, services[name]);
    }
}
app.listen(8000, () => console.log('Listening on port 8000!'));
