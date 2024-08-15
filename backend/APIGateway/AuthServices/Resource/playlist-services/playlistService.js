import { PlaylistIndex, playlistConnection } from '../models/playlist.js';
import { v4 as uuidv4 } from 'uuid';
import Counter from '../models/counter.js';
import grpc from '@grpc/grpc-js';

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
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  },

  async getPlaylistById(call, callback) {
    const { pid } = call.request;
    try {
      const playlist = await PlaylistIndex.findOne({ pid });
      if (!playlist) {
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
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  },

  async addToPlaylist(call, callback) {
    const { pid, trackId } = call.request;

    try {
      const existingTrack = await playlistConnection.collection(`p_${pid}`).findOne({ tid: trackId });

      if (existingTrack) {
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
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
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
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
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
    } catch (error) {
      console.error('Error creating playlist:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to create playlist'
      });
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
        return;
      }

      const playlistCollection = playlistConnection.collection(`p_${pid}`);
      const result = await playlistCollection.deleteOne({ tid: trackId });

      if (result.deletedCount === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: "Track not found in the playlist"
        });
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
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
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
    } catch (error) {
      console.error('Error deleting playlist:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error'
      });
    }
  }
};
