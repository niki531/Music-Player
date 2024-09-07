import { PlaylistIndex, playlistConnection } from '../models/playlist.js';
import { v4 as uuidv4 } from 'uuid';
import Counter from '../models/counter.js';
import grpc from '@grpc/grpc-js';
import { logMessage } from '../../../LogServices/log.js';
import { sendStatistics } from '../../Statistics/stat.js';

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.sequence_value;
}

async function decrementCounter(sequenceName) {
  const sequenceDocument = await Counter.findById(sequenceName);
  if (sequenceDocument) {
    const updatedSequenceDocument = await Counter.findByIdAndUpdate(
      sequenceName,
      { $inc: { sequence_value: -1 } },
      { new: true }
    );
    return updatedSequenceDocument.sequence_value;
  } else {
    console.warn(`Counter ${sequenceName} does not exist.`);
    return null;
  }
}

export const PlaylistService = {
  async getPlaylists(call, callback) {
    try {
      const playlists = await PlaylistIndex.find({ public: true });
      callback(null, {
        playlists: playlists.map(playlist => ({
          pid: playlist.pid,
          name: playlist.name,
          author: playlist.author,
          author_uid: playlist.author_uid,
          description: playlist.description,
          added: playlist.added,
          liked: playlist.liked,
          shared: playlist.shared,
          played: playlist.played,
          public: playlist.public,
          type: playlist.type,
          image: playlist.image,
          last_update: playlist.last_update.toISOString(),
        })),
        total: playlists.length
      });
      await logMessage('PlaylistService', 'INFO', 'Fetched playlists successfully');
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
      await logMessage('PlaylistService', 'ERROR', `Failed to fetch playlists: ${err.message}`);
    }
  },

  async getPlaylistById(call, callback) {
    const { pid } = call.request;
    try {
      const playlist = await PlaylistIndex.findOne({ pid });
      if (!playlist) {
        await logMessage('PlaylistService', 'WARN', `Playlist with ID ${pid} not found`);
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Resource doesn't exist"
        });
        return;
      }

      const trackCollection = playlistConnection.collection(`p_${pid}`);
      const tracks = await trackCollection.find().toArray();

      callback(null, {
        pid: playlist.pid,
        name: playlist.name,
        author: playlist.author,
        author_uid: playlist.author_uid,
        tracks: tracks.map(track => ({
          tid: track.tid,
          order: track.order
        }))
      });
      await logMessage('PlaylistService', 'INFO', `Fetched playlist details for ID ${pid}`);
      await sendStatistics(
        'AlbumService',  
        {
          albumId: pid, 
          plays: 1
        }
      );
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
      await logMessage('PlaylistService', 'ERROR', `Failed to fetch playlist details for ID ${pid}: ${err.message}`);
    }
  },

  async addToPlaylist(call, callback) {
    const { pid, trackId } = call.request;

    try {
      const existingTrack = await playlistConnection.collection(`p_${pid}`).findOne({ tid: trackId });

      if (existingTrack) {
        await logMessage('PlaylistService', 'WARN', `Track ${trackId} already exists in playlist ${pid}`);
        callback(null, { code: 400, msg: 'Track already exists in the playlist' });
        return;
      }

      await PlaylistIndex.findOneAndUpdate(
        { pid },
        {
          $inc: { added: 1 },
          $set: { last_update: new Date() }
        },
        { new: true }
      );

      const nextOrder = await getNextSequenceValue(`p_${pid}_order`);

      await playlistConnection.collection(`p_${pid}`).insertOne({
        tid: trackId,
        order: nextOrder
      });

      callback(null, { code: 200, msg: 'Playlist updated successfully' });
      await logMessage('PlaylistService', 'INFO', `Added track ${trackId} to playlist ${pid}`);
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
      await logMessage('PlaylistService', 'ERROR', `Failed to add track ${trackId} to playlist ${pid}: ${err.message}`);
    }
  },

  async getUserPlaylists(call, callback) {
    const { uid } = call.request;
    try {
      const playlists = await PlaylistIndex.find({ author_uid: uid, public: true });
      callback(null, {
        playlists: playlists.map(playlist => ({
          pid: playlist.pid,
          name: playlist.name,
          author: playlist.author,
          author_uid: playlist.author_uid,
          description: playlist.description,
          added: playlist.added,
          liked: playlist.liked,
          shared: playlist.shared,
          played: playlist.played,
          public: playlist.public,
          type: playlist.type,
          image: playlist.image,
          last_update: playlist.last_update.toISOString(),
        })),
        total: playlists.length
      });
      await logMessage('PlaylistService', 'INFO', `Fetched playlists for user ID ${uid}`);
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
      await logMessage('PlaylistService', 'ERROR', `Failed to fetch playlists for user ID ${uid}: ${err.message}`);
    }
  },

  async createPlaylist(call, callback) {
    const { uid, username, name, description } = call.request;

    const pid = uuidv4();

    try {
      const playlist = new PlaylistIndex({
        pid,
        author: username,
        author_uid: uid,
        name,
        description,
        added: 0,
        public: true,
        type: 'playlist',
        last_update: new Date(),
      });

      await playlist.save();
      await playlistConnection.createCollection(`p_${pid}`);
      callback(null, { pid });
      await logMessage('PlaylistService', 'INFO', `Created new playlist ${pid}`);
    } catch (error) {
      console.error('Error creating playlist:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to create playlist'
      });
      await logMessage('PlaylistService', 'ERROR', `Failed to create playlist: ${error.message}`);
    }
  },

  async removeTrackFromPlaylist(call, callback) {
    const { pid, trackId } = call.request;

    try {
      const playlist = await PlaylistIndex.findOne({ pid });

      if (!playlist) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Playlist not found"
        });
        await logMessage('PlaylistService', 'WARN', `Playlist with ID ${pid} not found`);
        return;
      }

      const playlistCollection = playlistConnection.collection(`p_${pid}`);
      const result = await playlistCollection.deleteOne({ tid: trackId });

      if (result.deletedCount === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Track not found in the playlist"
        });
        await logMessage('PlaylistService', 'WARN', `Track ${trackId} not found in playlist ${pid}`);
        return;
      }

      await decrementCounter(`p_${pid}_order`);

      const remainingTracks = await playlistCollection.find().sort({ order: 1 }).toArray();

      await Promise.all(
        remainingTracks.map(async (track, index) => {
          await playlistCollection.updateOne(
            { tid: track.tid },
            { $set: { order: index + 1 } }
          );
        })
      );

      await PlaylistIndex.updateOne(
        { pid },
        { $inc: { added: -1 }, $set: { last_update: new Date() } }
      );

      callback(null, { code: 200, msg: 'Track removed from playlist and order updated' });
      await logMessage('PlaylistService', 'INFO', `Removed track ${trackId} from playlist ${pid}`);

    } catch (error) {
      console.error('Error removing track from playlist:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
      await logMessage('PlaylistService', 'ERROR', `Failed to remove track ${trackId} from playlist ${pid}: ${error.message}`);
    }
  },

  async deletePlaylist(call, callback) {
    const { pid } = call.request;

    try {
      await PlaylistIndex.updateOne(
        { pid },
        { $set: { public: false, last_update: new Date() } }
      );

      callback(null, { code: 200, msg: 'Playlist is now hidden from the platform' });
      await logMessage('PlaylistService', 'INFO', `Deleted playlist ${pid}`);
    } catch (error) {
      console.error('Error deleting playlist:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
      await logMessage('PlaylistService', 'ERROR', `Failed to delete playlist ${pid}: ${error.message}`);
    }
  }
};
