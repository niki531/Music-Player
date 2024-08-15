import Router from 'koa-router';
import { logoutUser, getUserInfo } from './userController.js';
import authenticateJWT from '../../jwtGateway/auth.js';

const router = new Router();

router.delete('/logout', authenticateJWT, logoutUser);
router.get('/mypage', authenticateJWT, getUserInfo); 


export default router;
