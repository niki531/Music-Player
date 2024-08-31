import jwt from 'jsonwebtoken';
import { secret } from './config/jwtConfig.js';
import { isTokenBlacklisted } from './utils/blacklistUtils.js';

const authenticateJWT = async (ctx, next) => {
  const authHeader = ctx.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    const b = await isTokenBlacklisted(token);
    if (b) {
      ctx.status = 403;
      ctx.body = { error: 'Token has been blacklisted' };
      return;
    }

    try {
      const user = jwt.verify(token, secret);
      ctx.state.user = user;
      ctx.state.token = token;      
      await next();
    } catch (err) {
      ctx.status = 403; 
      ctx.body = { error: 'Forbidden' };
    }
  } else {
    ctx.status = 401; 
    ctx.body = { error: 'Unauthorized' };
  }
};

export default authenticateJWT;
