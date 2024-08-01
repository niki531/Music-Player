import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import send from 'koa-send';
import { LibraryIndex, UserLibrary, libraryConnection } from '../models/library.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export const streamTrackById = async (ctx) => {
  const trackId = ctx.params.track_id;
  //console.log(`Received request for track ID: ${trackId}`);

  try {
    const track = await LibraryIndex.findOne({ track_id: trackId });
    if (!track) {
      ctx.status = 404;
      ctx.body = 'Track ID not found';
      console.error('Track ID not found:', trackId);
      return;
    }

    const filePath = path.join(__dirname, track.file);
    //console.log('Resolved file path:', filePath);

    try {
      await fs.access(filePath);
    } catch (err) {
      ctx.status = 404;
      ctx.body = 'Audio file not found';
      console.error('Audio file not found at path:', filePath);
      return;
    }

    try {
      await send(ctx, filePath, {
        root: '/',
        setHeaders: (res, path, stats) => {
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Accept-Ranges', 'bytes');
        },
      });
      //console.log(`Successfully streamed file using koa-send: ${filePath}`);
    } catch (err) {
      ctx.status = 500;
      ctx.body = 'Error streaming file';
      console.error('Error streaming file using koa-send:', filePath, err.message, err.stack);
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = 'Internal server error';
    console.error('Internal server error:', err);
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
