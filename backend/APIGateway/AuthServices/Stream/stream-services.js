import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import streamRoutes from './stream-services/streamRoutes.js';
import occupationRoutes from './occupation-handler/occupationRoutes.js';
import axios from 'axios';

const app = new Koa();
app.use(bodyParser());
app.use(streamRoutes.routes()).use(streamRoutes.allowedMethods());
app.use(occupationRoutes.routes()).use(occupationRoutes.allowedMethods());

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Service running on http://localhost:${PORT}`);

    // Register stream Service
    axios.post('http://localhost:3000/register', {
        name: "stream-service",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "stream", method: ["get"] }
        ]
    }).then(() => {
        console.log('Stream service registered.');
    }).catch(err => {
        console.error('Failed to register Stream service:', err);
    });

    // Register occupation Service
    axios.post('http://localhost:3000/register', {
        name: "occupation-handler",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "occupation", method: ["get", "post"] }
        ]
    }).then(() => {
        console.log('Occupation handler registered.');
    }).catch(err => {
        console.error('Failed to register occupation handler:', err);
    });
});
