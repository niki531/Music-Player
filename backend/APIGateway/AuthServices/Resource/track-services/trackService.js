import { LibraryIndex } from '../models/library.js';
import grpc from '@grpc/grpc-js';

export const TrackService = {
  async getTracks(call, callback) {
    try {
      const tracks = await LibraryIndex.find();
      callback(null, {
        data: tracks.map(track => ({
          track_id: track.track_id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          album_id: track.album_id,
          genre: track.genre,
          copyright: track.copyright,
          length: track.length,
          track_number: track.track_number,
          quality: track.quality,
          file: track.file
        })),
        total: tracks.length
      });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  },

  async getTrackById(call, callback) {
    const { track_id } = call.request;
    console.log('track id is:', track_id);
    try {
      const track = await LibraryIndex.findOne({ track_id });
      if (!track) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Resource doesn't exist"
        });
        return;
      }
      callback(null, {
        data: {
          track_id: track.track_id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          album_id: track.album_id,
          genre: track.genre,
          copyright: track.copyright,
          length: track.length,
          track_number: track.track_number,
          quality: track.quality,
          file: track.file
        }
      });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  },

  async deleteTrack(call, callback) {
    const { track_id } = call.request;

    try {
      const track = await LibraryIndex.findOneAndDelete({ track_id });
      if (!track) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Track doesn't exist"
        });
        return;
      }
      callback(null, { code: 200, msg: 'Track deleted successfully' });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  }
};
