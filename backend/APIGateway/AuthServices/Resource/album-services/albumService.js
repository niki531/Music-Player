import { playlistConnection, PlaylistIndex } from '../models/playlist.js';
import grpc from '@grpc/grpc-js';


export const AlbumService = {
    async getAlbums(call, callback) {
        try {
          const albums = await PlaylistIndex.find({ type: 'album' });
          const albumList = albums.map(album => ({
            pid: album.pid,
            author: album.author,
            author_uid: album.author_uid,
            name: album.name,
            description: album.description,
            added: album.added,
            liked: album.liked,
            shared: album.shared,
            played: album.played,
            public: album.public,
            image: album.image,
            type: album.type,
            last_update: album.last_update ? album.last_update.toISOString() : ''
          }));
          callback(null, { albums: albumList });
        } catch (err) {
          callback({
            code: grpc.status.INTERNAL,
            message: 'Internal server error'
          });
        }
      }
      ,
  async getAlbumById(call, callback) {
    const playlistId = call.request.pid;
    console.log(`Received albumId: ${playlistId}`);

    try {
      const playlist = await PlaylistIndex.findOne({ pid: playlistId, type: 'album' });
      if (!playlist) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Resource doesn't exist"
        });
        return;
      }
      const trackCollection = playlistConnection.collection(`p_${playlistId}`);
      const tracks = await trackCollection.find().toArray();
      const trackList = tracks.map(track => ({
        tid: track.tid,
        order: track.order
      }));
  
      callback(null, {
        pid: playlist.pid,
        name: playlist.name,
        author: playlist.author,
        tracks: trackList
      });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  },
  async deleteAlbum(call, callback) {
    const { id } = call.request;
  
    try {
      const album = await PlaylistIndex.findOneAndDelete({ pid: id });
      if (!album) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Album doesn't exist"
        });
      } else {
        callback(null, {});  
      }
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  },
};
