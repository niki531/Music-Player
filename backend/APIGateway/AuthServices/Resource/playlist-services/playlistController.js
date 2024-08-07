import { PlaylistIndex, playlistConnection} from '../models/playlist.js';
import { v4 as uuidv4 } from 'uuid';
import Counter from '../models/counter.js';

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

export const getPlaylists = async (ctx) => {
  try {
    const playlists = await PlaylistIndex.find({ public: true });
    ctx.body = {
      data: playlists,
      total: playlists.length
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const getPlaylistById = async (ctx) => {
  const playlistId = ctx.params.pid;
  try {
    const playlist = await PlaylistIndex.findOne({ pid: playlistId });
    if (!playlist) {
      ctx.status = 404;
      ctx.body = { err: 201, msg: "Resource doesn't exist" };
      return;
    }
    const name = playlist.name;
    const author = playlist.author;
    const author_uid = playlist.author_uid;

    const trackCollection = playlistConnection.collection(`p_${playlistId}`);
    const tracks = await trackCollection.find().toArray();

    ctx.body = {
      data: {
        name: name,
        author: author,
        author_uid: author_uid,
        pid: playlistId,
        tracks
      }
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const addToPlaylist = async (ctx) => {
  const playlistId = ctx.params.pid;
  const trackId = ctx.request.body.trackId;

  try {
    const existingTrack = await playlistConnection.collection(`p_${playlistId}`).findOne({ tid: trackId });

    if (existingTrack) {
      ctx.status = 400;
      ctx.body = { err: 400, msg: 'Track already exists in the playlist' };
      return;
    }
    
    const playlist = await PlaylistIndex.findOneAndUpdate(
      { pid: playlistId },
      {
        $inc: { added: 1 },
        $set: { last_update: new Date() }
      },
      { new: true }
    );

    const nextOrder = await getNextSequenceValue(`p_${playlistId}_order`);

    await playlistConnection.collection(`p_${playlistId}`).insertOne({
      tid: trackId,
      order: nextOrder
    });

    ctx.body = { msg: 'Playlist updated successfully', data: playlist };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const getUserPlaylists = async (ctx) => {
  const uid  = ctx.headers['x-user-uid'];
  if (!uid) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return;
  }
  try {
    const playlists = await PlaylistIndex.find({ author_uid: uid, public: true });
    ctx.status = 200;
    ctx.body = { 
      data: playlists,
      total: playlists.length
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch user playlists' };
    console.error(err);
  }
};

export const createPlaylist = async (ctx) => {
  const uid = ctx.headers['x-user-uid'];
  const username = ctx.headers['x-user-username']
  const { name, description } = ctx.request.body;

  const pid = uuidv4(); 

  try {
    const playlist = new PlaylistIndex({ 
      pid: pid, 
      author: username, 
      author_uid: uid,
      name: name, 
      description: description,
      added: 0,
      public:true,
      type: 'playlist',
      last_update: new Date(),
    });

    await playlist.save();
    await playlistConnection.createCollection(`p_${pid}`);
    ctx.status = 201;
    ctx.body = { pid };
  } catch (error) {
    console.error('Error creating playlist:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create playlist' };
  }
};

export const removeTrackFromPlaylist = async (ctx) => {
  //console.log('Removing track from playlist');

  const uid = ctx.headers['x-user-uid'];
  const {pid, trackId} = ctx.query;
  //console.log('The playlist id is ', pid);
  //console.log('The track id is ', trackId);


  try {
    const playlist = await PlaylistIndex.findOne({ pid: pid });

    if (!playlist) {
      ctx.status = 404;
      ctx.body = { err: 404, msg: "Playlist not found" };
      return;
    }

    if (playlist.author_uid !== uid) {
      ctx.status = 403;
      ctx.body = { err: 403, msg: "You cannot remove tracks from this playlist" };
      return;
    }

    const playlistCollection = playlistConnection.collection(`p_${pid}`);
    const result = await playlistCollection.deleteOne({ tid: trackId });

    if (result.deletedCount === 0) {
      ctx.status = 404;
      ctx.body = { err: 404, msg: "Track not found in the playlist" };
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
      { pid: pid },
      { $inc: { added: -1 }, $set: { last_update: new Date() } }
    );

    ctx.status = 200;
    ctx.body = { msg: 'Track removed from playlist and order updated' };
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const deletePlaylist = async (ctx) => {
  const playlistId = ctx.params.pid;

  try {

    await PlaylistIndex.updateOne(
      { pid: playlistId },
      { $set: { public: false, last_update: new Date() } }
    );

    ctx.status = 200;
    ctx.body = { msg: 'Playlist is now hidden from the platform' };
  } catch (error) {
    console.error('Error deleting playlist:', error);
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};