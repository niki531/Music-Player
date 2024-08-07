import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import userRoutes from './log-services/userRoutes.js';
import axios from 'axios';

const app = new Koa();
app.use(bodyParser());
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`Service running on http://localhost:${PORT}`);

    // Register log Service
    axios.post('http://localhost:3000/register', {
        name: "log-service",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "log-service", method: ["get", "delete"] }
        ]
    }).then(() => {
        console.log('Log service registered.');
    }).catch(err => {
        console.error('Failed to register Log service:', err);
    });
});
