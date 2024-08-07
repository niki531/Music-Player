import Router from 'koa-router';
import { updateUserPlayingStatus, getUserPlayingStatus } from './occupationController.js';
import checkAccess from '../dynamic-auth.js';

const router = new Router();

router.post('/user/:uid', checkAccess, updateUserPlayingStatus);
router.get('/user/:uid', checkAccess, getUserPlayingStatus);


export default router;
