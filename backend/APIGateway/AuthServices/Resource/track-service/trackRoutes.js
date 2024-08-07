import Router from 'koa-router';
import { getTracks, getTrackById, deleteTrack} from './trackController.js';
import { checkAccess } from '../dynamic-auth.js';

const router = new Router();

router.get('/track', checkAccess, getTracks);
router.get('/track/:track_id', checkAccess, getTrackById);
router.delete('/track/:track_id', checkAccess, deleteTrack);

export default router;
