import User from '../models/user.js';
import { blacklistToken } from '../utils/blacklistUtils.js';


export const logoutUser = async (ctx) => {
  console.log('Logging out user');

  const { uid } = ctx.state.user;
  const token = ctx.state.token;
  try{

    await blacklistToken(token);

    console.log(`User ${uid} logged out`);

    ctx.status = 200;
    ctx.body = { message: 'Logged out successfully' };
  }catch(error){
    console.error('Error logging out user:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
};

export const getUserInfo = async (ctx) => {
  const { uid } = ctx.state.user;
  try {
    const user = await User.findOne({ uid }, 'uid name subscribe subscribe_expired');

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.body = { user };
    console.log('user information fetched');
  } catch (error) {
    console.error('Error fetching user info:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }

};


