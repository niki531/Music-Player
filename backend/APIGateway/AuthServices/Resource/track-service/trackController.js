import { LibraryIndex} from '../models/library.js';

export const getTracks = async (ctx) => {
  try {
    const tracks = await LibraryIndex.find();
    ctx.body = {
      data: tracks,
      total: tracks.length
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const getTrackById = async (ctx) => {
  const trackId = ctx.params.track_id;
  try {
    const track = await LibraryIndex.findOne({ track_id: trackId });
    if (!track) {
      ctx.status = 404;
      ctx.body = { err: 201, msg: "Resource doesn't exist" };
      return;
    }
    ctx.body = {
      data: track
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const deleteTrack = async (ctx) => {
  const { track_id } = ctx.params;

  try {
    const track = await LibraryIndex.findOneAndDelete({ track_id: track_id });

    if (!track) {
      ctx.status = 404;
      ctx.body = { err: 201, msg: "Track doesn't exist" };
    } else {
      ctx.body = { data: track };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};
