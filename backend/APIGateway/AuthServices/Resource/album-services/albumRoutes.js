import Router from 'koa-router';
import { getAlbums, getAlbumById, deleteAlbum } from './albumController.js';
import { checkAccess } from '../dynamic-auth.js';
const router = new Router();

router.get('/album', checkAccess, getAlbums);
router.get('/album/:pid', checkAccess, getAlbumById);
router.delete('/album/:pid', checkAccess, deleteAlbum);


export default router;
