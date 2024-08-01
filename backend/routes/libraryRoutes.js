import { addUserLibrary, getUserLibrary, removePlaylistFromLibrary } from "../controllers/libraryController.js";
import authenticateJWT from "../middleware/auth.js";
import Router from 'koa-router';


const router = new Router();
router.post('/track/library', authenticateJWT, addUserLibrary);
router.delete('/library/playlist/:pid', authenticateJWT, removePlaylistFromLibrary);
router.get('/library', authenticateJWT, getUserLibrary);
export default router;


