import { libraryConnection } from "../models/library.js";
import grpc from '@grpc/grpc-js';
import { logMessage } from '../../../LogServices/log.js';
import { sendStatistics } from '../../Statistics/stat.js';

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
        await logMessage('UserLibraryService', 'WARN', `Item ${id} already exists in user ${uid}'s library`);
        callback(null, { code: 400, msg: 'Item already exists in library' });
        return;
      }
      
      await userLibraryCollection.insertOne({
        type: type,
        id: id,
        added_date: new Date()
      });
  
      callback(null, { code: 201, msg: 'Item added to library' });
      await logMessage('UserLibraryService', 'INFO', `Item ${id} added to user ${uid}'s library`);
      if (type == 'track'){
        await sendStatistics(
          'TrackService',  
          {
            trackId: id, 
            likes: 1
          }
        );
      } else {
        await sendStatistics(
          'AlbumService',  
          {
            albumId: id, 
            likes: 1
          }
        );
      }
    } catch (err) {
      await logMessage('UserLibraryService', 'ERROR', `Failed to add item ${id} to user ${uid}'s library: ${err.message}`);
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
        await logMessage('UserLibraryService', 'WARN', `No items found in user ${uid}'s library for type ${type}`);
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
        await logMessage('UserLibraryService', 'INFO', `Fetched ${items.length} items from user ${uid}'s library`);
      }
    } catch (err) {
      await logMessage('UserLibraryService', 'ERROR', `Failed to fetch items from user ${uid}'s library: ${err.message}`);
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
      const result = await userLibrary.deleteOne({ id: pid, type: 'playlist' });

      if (result.deletedCount === 0) {
        await logMessage('UserLibraryService', 'WARN', `Playlist ${pid} not found in user ${uid}'s library`);
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Playlist not found in the library"
        });
        return;
      }

      callback(null, { code: 200, msg: "Playlist removed from user's library" });
      await logMessage('UserLibraryService', 'INFO', `Removed playlist ${pid} from user ${uid}'s library`);
    } catch (error) {
      await logMessage('UserLibraryService', 'ERROR', `Failed to remove playlist ${pid} from user ${uid}'s library: ${error.message}`);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  }
};
