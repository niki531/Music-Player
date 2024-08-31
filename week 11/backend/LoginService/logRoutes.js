import Router from 'koa-router';
import { registerUser,loginUser } from './logController.js';

const router = new Router();

router.post('/user/register', registerUser);
router.post('/user/login', loginUser);


export default router;
