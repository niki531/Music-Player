import { LibraryIndex } from '../models/library.js';
import grpc from '@grpc/grpc-js';
import { logMessage } from '../../../LogServices/log.js';

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
      await logMessage('TrackService', 'INFO', `Fetched ${tracks.length} tracks successfully`);
    } catch (err) {
      await logMessage('TrackService', 'ERROR', `Failed to fetch tracks: ${err.message}`);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  },

  async getTrackById(call, callback) {
    const { track_id } = call.request;
    //console.log('track id is:', track_id);
    try {
      const track = await LibraryIndex.findOne({ track_id });
      if (!track) {
        await logMessage('TrackService', 'WARN', `Track with ID ${track_id} not found`);
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
      await logMessage('TrackService', 'INFO', `Fetched track details for ID ${track_id}`);
    } catch (err) {
      await logMessage('TrackService', 'ERROR', `Failed to fetch track details for ID ${track_id}: ${err.message}`);
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
        await logMessage('TrackService', 'WARN', `Attempted to delete non-existent track with ID ${track_id}`);
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Track doesn't exist"
        });
        return;
      }
      callback(null, { code: 200, msg: 'Track deleted successfully' });
      await logMessage('TrackService', 'INFO', `Deleted track with ID ${track_id}`);
    } catch (error) {
      await logMessage('TrackService', 'ERROR', `Failed to delete track with ID ${track_id}: ${error.message}`);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  }
};
