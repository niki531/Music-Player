import User from '../models/user.js';

export const updateUserPlayingStatus = async (ctx) => {
  //console.log('Received request to update playing status');
  const { uid } = ctx.params;
  const { playing } = ctx.request.body;

  console.log('UID:', uid);
  console.log('Playing:', playing);

  try {
    await User.updateOne({ uid }, { playing });

    ctx.status = 200;
    ctx.body = { msg: 'Playing status updated' };
  } catch (error) {
    console.error('Error updating playing status:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update playing status' };
  }
};


export const getUserPlayingStatus = async (ctx) => {
  //console.log('Received request to check playing status'); 
  const { uid } = ctx.params; 

  try {
    const user = await User.findOne({ uid }, { playing: 1 }); 

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.status = 200;
    ctx.body = { playing: user.playing };
  } catch (error) {
    console.error('Error fetching playing status:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch playing status' };
  }
};
