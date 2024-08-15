import grpc from '@grpc/grpc-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { PassThrough } from 'stream';
import { LibraryIndex } from '../models/library.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const StreamService = {
  streamTrackById: async (call) => {
    const trackId = call.request.track_id;
    console.log(`Received request for track ID: ${trackId}`);

    try {
      const track = await LibraryIndex.findOne({ track_id: trackId });
      if (!track) {
        console.error('Track ID not found:', trackId);
        call.emit('error', {
          code: grpc.status.NOT_FOUND,
          message: 'Track ID not found',
        });
        return;
      }

      const filePath = path.join(__dirname, track.file);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File does not exist: ${filePath}`);
        call.emit('error', {
          code: grpc.status.NOT_FOUND,
          message: 'File not found',
        });
        return;
      }
      console.log('Resolved file path:', filePath);
            
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => {
        //console.log(`Streaming chunk of size: ${chunk.length}`);
        call.write({ data: chunk });
      });

      stream.on('end', () => {
        //console.log('Streaming ending.');
        call.end();
        console.log('Streaming ended.');
      });

      stream.on('error', (err) => {
        console.error('Error streaming file:', err);
        call.emit('error', {
          code: grpc.status.INTERNAL,
          message: 'Error streaming file',
        });
      });
    } catch (err) {
      console.error('Internal server error:', err);
      call.emit('error', {
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
};
