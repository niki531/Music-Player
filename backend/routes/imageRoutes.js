import Router from 'koa-router';
import { getAlbumCover } from '../controllers/imageController.js';
import authenticateJWT from '../middleware/auth.js';

const router = new Router();

router.get('/image/:album_id', authenticateJWT, getAlbumCover);

export default router;
