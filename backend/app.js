import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import path from 'path';
import serve from 'koa-static';
import { fileURLToPath } from 'url';
// import { main } from './scripts/libraryInit.js';
import logRoutes from './LoginService/logRoutes.js';
import serviceRegistry from './APIGateway/serviceRegistry.js';
import proxyRoutes from './APIGateway/routes.js';
import authenticateJWT from './APIGateway/jwtGateway/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
//main();

app.use(cors({
  origin: 'http://localhost:8080', 
  credentials: true
}));

app.use(bodyParser());
app.use(serve(path.join(__dirname, 'library')));

app.use(logRoutes.routes()).use(logRoutes.allowedMethods());
app.use(serviceRegistry);

app.use(authenticateJWT);
app.use(proxyRoutes.routes()).use(proxyRoutes.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

