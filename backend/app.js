import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import albumRoutes from './routes/albumRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import trackRoutes from './routes/trackRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import path from 'path';
import serve from 'koa-static';
import { fileURLToPath } from 'url';
import { main } from './scripts/libraryInit.js';
import libraryRoutes from './routes/libraryRoutes.js'

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

app.use(albumRoutes.routes()).use(albumRoutes.allowedMethods());
app.use(playlistRoutes.routes()).use(playlistRoutes.allowedMethods());
app.use(trackRoutes.routes()).use(trackRoutes.allowedMethods());
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());
app.use(imageRoutes.routes()).use(imageRoutes.allowedMethods());
app.use(libraryRoutes.routes()).use(libraryRoutes.allowedMethods());


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

