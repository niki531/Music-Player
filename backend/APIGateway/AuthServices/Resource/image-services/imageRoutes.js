import Router from 'koa-router';
import { getAlbumCover } from './imageController.js';
import { checkAccess } from '../dynamic-auth.js';


const router = new Router();

router.get('/image/:album_id', checkAccess, getAlbumCover);

export default router;
