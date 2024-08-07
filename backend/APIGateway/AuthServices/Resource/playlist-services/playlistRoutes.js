import Router from 'koa-router';
import { getPlaylists, getPlaylistById, createPlaylist, addToPlaylist, deletePlaylist, getUserPlaylists, removeTrackFromPlaylist } from './playlistController.js';
import { checkAccess } from '../dynamic-auth.js';

const router = new Router();
router.get('/playlist', checkAccess, getPlaylists);
router.get('/playlist/:pid', checkAccess, getPlaylistById);
router.put('/playlist/:pid', checkAccess, addToPlaylist);
router.delete('/playlist/:pid', checkAccess, deletePlaylist);
router.delete('/remove-playlist', checkAccess, removeTrackFromPlaylist);
router.get('/myplaylists', checkAccess, getUserPlaylists);
router.post('/playlist/create', checkAccess, createPlaylist);

export default router;
