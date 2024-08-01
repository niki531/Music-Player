import Router from 'koa-router';
import { getPlaylists, getPlaylistById, createPlaylist, addToPlaylist, deletePlaylist, getUserPlaylists, removeTrackFromPlaylist } from '../controllers/playlistController.js';
import authenticateJWT from '../middleware/auth.js';

const router = new Router();

router.get('/playlist', authenticateJWT, getPlaylists);
router.get('/playlist/:pid', authenticateJWT, getPlaylistById);
router.put('/playlist/:pid', authenticateJWT, addToPlaylist);
router.delete('/playlist/:pid', deletePlaylist);
router.delete('/playlist/:pid/track', authenticateJWT, removeTrackFromPlaylist);
router.get('/myplaylists', authenticateJWT, getUserPlaylists);
router.post('/playlist/create', authenticateJWT, createPlaylist);

export default router;
