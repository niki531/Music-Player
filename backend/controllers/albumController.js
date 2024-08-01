import { playlistConnection, PlaylistIndex } from '../models/playlist.js';

export const getAlbums = async (ctx) => {
  try {
    const albums = await PlaylistIndex.find({type: 'album' });
    ctx.body = {
      data: albums,
      total: albums.length
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const getAlbumById = async (ctx) => {
  const playlistId = ctx.params.pid;
  try {
    const playlist = await PlaylistIndex.findOne({ pid: playlistId, type: 'album' });
    if (!playlist) {
      ctx.status = 404;
      ctx.body = { err: 201, msg: "Resource doesn't exist" };
      return;
    }
    const name = playlist.name;
    const author = playlist.author;
    const trackCollection = playlistConnection.collection(`p_${playlistId}`);
    const tracks = await trackCollection.find().toArray();

    if (tracks.length === 0) {
      ctx.status = 404;
      ctx.body = { err: 201, msg: "Resource doesn't exist" };
      return;
    }

    ctx.body = {
      data: {
        name: name,
        author: author,
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

export const deleteAlbum = async (ctx) => {
  const { pid } = ctx.params;

  try {
    const album = await PlaylistIndex.findOneAndDelete({ pid: pid});

    if (!album) {
      ctx.status = 404;
      ctx.body = { err: 201, msg: "Album doesn't exist" };
    } else {
      ctx.body = { data: album };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};


