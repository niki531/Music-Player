import Router from 'koa-router';
import { registerUser, logoutUser, updateUserPlayingStatus, getUserPlayingStatus, loginUser, getUserInfo } from '../controllers/userController.js';
import authenticateJWT from "../middleware/auth.js";

const router = new Router();

router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.delete('/logout', authenticateJWT, logoutUser);
router.get('/mypage', authenticateJWT, getUserInfo); 
router.post('/user/:uid', authenticateJWT, updateUserPlayingStatus);
router.get('/user/:uid', authenticateJWT, getUserPlayingStatus);


export default router;
