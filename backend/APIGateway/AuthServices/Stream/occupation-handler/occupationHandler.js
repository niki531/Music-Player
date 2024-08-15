import grpc from '@grpc/grpc-js';
import User from '../models/user.js';

export const OccupationHandler = {
  updateUserPlayingStatus: async (call, callback) => {
    const { uid, playing } = call.request;

    console.log('UID:', uid);
    console.log('Playing:', playing);

    try {
      await User.updateOne({ uid }, { playing });

      callback(null, { msg: 'Playing status updated' });
    } catch (error) {
      console.error('Error updating playing status:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to update playing status',
      });
    }
  },

  getUserPlayingStatus: async (call, callback) => {
    const { uid } = call.request;

    console.log('UID:', uid);

    try {
      const user = await User.findOne({ uid }, { playing: 1 });

      if (!user) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found',
        });
        return;
      }

      callback(null, { playing: user.playing });
    } catch (error) {
      console.error('Error fetching playing status:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to fetch playing status',
      });
    }
  },
};
