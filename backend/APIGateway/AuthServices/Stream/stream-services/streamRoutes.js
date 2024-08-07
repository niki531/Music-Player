import Router from 'koa-router';
import { streamTrackById} from './streamController.js';
import checkAccess from '../dynamic-auth.js';

const router = new Router();

router.get('/stream/:track_id', checkAccess, streamTrackById);

export default router;
