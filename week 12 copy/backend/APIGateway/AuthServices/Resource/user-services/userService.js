import grpc from '@grpc/grpc-js';
import User from '../models/user.js';
import { blacklistToken } from '../utils/blacklistUtils.js';
import { logMessage } from '../../../LogServices/log.js';


export const UserService = {
  logoutUser: async (call, callback) => {  
    //console.log('Received request:', call.request);  
    const { uid, token } = call.request; 
    //console.log('uid for logout is ', uid);
    try {
      await blacklistToken(token);

      console.log(`User ${uid} logged out`);
      await logMessage('UserService', 'INFO', `User ${uid} logged out successfully`);

      callback(null, { msg: 'Logged out successfully', code: 200 });  
    } catch (error) {
      await logMessage('UserService', 'ERROR', `Error logging out user ${uid}: ${error.message}`);
      console.error('Error logging out user:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal Server Error',
      });
    }
  },

  getUserInfo: async (call, callback) => { 
    const { uid } = call.request; 
    //console.log('uid for user info is ', uid);
    try {
      const user = await User.findOne({ uid }, 'uid name subscribe subscribe_expired');

      if (!user) {
        await logMessage('UserService', 'WARN', `User ${uid} not found`);
        callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found',
        });
        return;
      }

      console.log(`Fetched user information for user ${uid}`);
      await logMessage('UserService', 'INFO', `User information fetched for user ${uid}`);

      callback(null, {  
        uid: user.uid,
        name: user.name,
        subscribe: user.subscribe,
        subscribe_expired: user.subscribe_expired,
      });
    } catch (error) {
      await logMessage('UserService', 'ERROR', `Error fetching user info for ${uid}: ${error.message}`);
      console.error('Error fetching user info:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal Server Error',
      });
    }
  },
};

