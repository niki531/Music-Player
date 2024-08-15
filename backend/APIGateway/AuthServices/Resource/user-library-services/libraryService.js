import { libraryConnection } from "../models/library.js";
import grpc from '@grpc/grpc-js';

export const UserLibraryService = {
  async addUserLibrary(call, callback) {
    const { uid, id, type } = call.request;
    // console.log('uid is', uid);
    // console.log('id is', id);
    // console.log('type is', type);

    try {
      const userLibraryCollection = libraryConnection.collection(uid);
      
      const existingitem = await userLibraryCollection.findOne({ type: type, id: id });

      if (existingitem) {
        callback(null, { code: 400, msg: 'Item already exists in library' });
        return;
      }
      
      await userLibraryCollection.insertOne({
        type: type,
        id: id,
        added_date: new Date()
      });
  
      callback(null, { code: 201, msg: 'Item added to library' });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to add item to library'
      });
    }
  },

  async getUserLibrary(call, callback) {
    const { uid, type } = call.request;
    console.log('uid is', uid);
    console.log('type is', type);
    try {
      const userLibraryCollection = libraryConnection.collection(uid);
      const items = await userLibraryCollection.find({ type }).sort({ added_date: -1 }).toArray();
  
      if (items.length === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Resource doesn't exist"
        });
      } else {
        items.forEach(item => {
          console.log('item content:', item);
        });
        const mappedItems = items.map(item => {
          return {
              id: item.id,
              type: item.type,
              added_date: item.added_date
          };
        });
        callback(null, { data: mappedItems });
      }
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to fetch user library'
      });
    }
  },

  async removePlaylistFromLibrary(call, callback) {
    const { uid, pid } = call.request;
  
    try {
      const userLibrary = libraryConnection.collection(uid);
      await userLibrary.deleteOne({ id: pid, type: 'playlist' });

      callback(null, { code: 200, msg: "Playlist removed from user's library" });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  }
};
