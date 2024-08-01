import Router from 'koa-router';
import { getAlbums, getAlbumById, deleteAlbum } from '../controllers/albumController.js';
import authenticateJWT from '../middleware/auth.js'; 

const router = new Router();

router.get('/album', authenticateJWT, getAlbums);
router.get('/album/:pid', authenticateJWT, getAlbumById);
router.delete('/album/:pid', authenticateJWT, deleteAlbum);


export default router;
