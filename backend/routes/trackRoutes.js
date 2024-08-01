import Router from 'koa-router';
import { getTracks, getTrackById, deleteTrack, streamTrackById} from '../controllers/trackController.js';
import authenticateJWT from '../middleware/auth.js';

const router = new Router();

router.get('/track', authenticateJWT, getTracks);
router.get('/track/:track_id', authenticateJWT, getTrackById);
router.get('/stream/:track_id', authenticateJWT, streamTrackById);
router.delete('/track/:track_id', authenticateJWT, deleteTrack);

export default router;
