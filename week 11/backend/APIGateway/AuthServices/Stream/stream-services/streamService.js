import grpc from '@grpc/grpc-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { LibraryIndex } from '../models/library.js'; 
import { logMessage } from '../../../rabbitmq.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const StreamService = {
  streamTrackById: async (call) => {
    const trackId = call.request.track_id;
    //console.log(`Received request for track ID: ${trackId}`);

    try {
      const track = await LibraryIndex.findOne({ track_id: trackId });
      if (!track) {
        await logMessage('StreamService', 'WARN', `Track ID ${trackId} not found`);
        console.error('Track ID not found:', trackId);
        call.emit('error', {
          code: grpc.status.NOT_FOUND,
          message: 'Track ID not found',
        });
        return;
      }

      const filePath = path.join(__dirname, track.file);
      
      if (!fs.existsSync(filePath)) {
        await logMessage('StreamService', 'WARN', `File for track ID ${trackId} not found at path ${filePath}`);
        console.error(`File does not exist: ${filePath}`);
        call.emit('error', {
          code: grpc.status.NOT_FOUND,
          message: 'File not found',
        });
        return;
      }
      //console.log('Resolved file path:', filePath);
            
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => {
        //console.log(`Streaming chunk of size: ${chunk.length}`);
        call.write({ data: chunk });
      });

      stream.on('end', async () => {
        //console.log('Streaming ending.');
        call.end();
        //console.log('Streaming ended.');
        await logMessage('StreamService', 'INFO', `Streaming for track ID ${trackId} ended successfully`);

      });

      stream.on('error', async (err) => {
        await logMessage('StreamService', 'ERROR', `Error streaming file for track ID ${trackId}: ${err.message}`);
        console.error('Error streaming file:', err);
        call.emit('error', {
          code: grpc.status.INTERNAL,
          message: 'Error streaming file',
        });
      });
    } catch (err) {
      await logMessage('StreamService', 'ERROR', `Internal server error while streaming track ID ${trackId}: ${err.message}`);
      console.error('Internal server error:', err);
      call.emit('error', {
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
};
