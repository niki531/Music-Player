import { addUserLibrary, getUserLibrary, removePlaylistFromLibrary } from "./libraryController.js";
import Router from 'koa-router';
import { checkAccess } from '../dynamic-auth.js';

const router = new Router();
router.post('/track/library', checkAccess, addUserLibrary);
router.delete('/library/playlist/:pid', checkAccess, removePlaylistFromLibrary);
router.get('/library', checkAccess, getUserLibrary);
export default router;


