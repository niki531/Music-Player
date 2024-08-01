import { libraryConnection } from "../models/library.js";

export const addUserLibrary = async (ctx) => {
  console.log('User State:', ctx.state.user); 

    const { uid } = ctx.state.user;
    const { id, type } = ctx.request.body;
  
    try {
      const userLibraryCollection = libraryConnection.collection(uid);
      
      const existingitem = await userLibraryCollection.findOne({ type: type, id: id });

      if (existingitem) {
        ctx.status = 400; 
        ctx.body = { message: 'Item already exists in library' };
        return;
      }
      
      await userLibraryCollection.insertOne({
        type: type,
        id: id,
        added_date: new Date()
      });
  
      ctx.status = 201;
      ctx.body = { message: 'Item added to library' };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: 'Failed to add item to library' };
    }
  };

  export const getUserLibrary = async (ctx) => {
    const { uid } = ctx.state.user;
    if (!uid) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized' };
      return;
    }
  
    const { type } = ctx.query; 
    try {
      //console.log(`Fetching library for user: ${uid} with type: ${type}`);
      const userLibraryCollection = libraryConnection.collection(uid);
      const items = await userLibraryCollection.find({ type }).sort({ added_date: -1 }).toArray();
  
      //console.log(`Query result: ${JSON.stringify(items)}`);
  
      if (items.length === 0) {
        ctx.status = 404;
        ctx.body = { err: 201, msg: "Resource doesn't exist" };
      } else {
        ctx.status = 200;
        ctx.body = { data: items };
      }
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: 'Failed to fetch user library' };
      console.error(err);
    }
  };
  

export const removePlaylistFromLibrary = async (ctx) => {
  console.log('User State:', ctx.state.user); 
  const { uid } = ctx.state.user;
  const playlistId = ctx.params.pid;

  try {
    const userLibrary = libraryConnection.collection(uid);
    await userLibrary.deleteOne({ id: playlistId, type: 'playlist' });

    ctx.status = 200;
    ctx.body = { msg: 'Playlist removed from user\'s library' };
  } catch (error) {
    console.error('Error removing playlist from library:', error);
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

  