import grpc from '@grpc/grpc-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { LibraryIndex } from '../models/library.js'; 
import { logMessage } from '../../../LogServices/log.js';
import { sendStatistics } from '../../Statistics/stat.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const StreamService = {
  streamTrackById: async (call) => {
    const trackId = call.request.track_id;
    const uid = call.request.uid;
    console.log(`Received stream request for track ID: ${trackId}`);
    console.log(`uid is: ${uid}`);
    let isLogged = false; 

    try {
      const track = await LibraryIndex.findOne({ track_id: trackId });
      if (!track) {
        if (!isLogged) {
        await logMessage('StreamService', 'WARN', `Track ID ${trackId} not found`);
        console.error('Track ID not found:', trackId);
          isLogged = true;
        }
        call.emit('error', {
          code: grpc.status.NOT_FOUND,
          message: 'Track ID not found',
        });
        return;
      }

      const filePath = path.join(__dirname, track.file);
      
      if (!fs.existsSync(filePath)) {
        if (!isLogged) {
          await logMessage('StreamService', 'WARN', `File for track ID ${trackId} not found at path ${filePath}`);
          console.error(`File does not exist: ${filePath}`);
          isLogged = true;
        }
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
        if (!isLogged) {
          await logMessage('StreamService', 'INFO', `Streaming for track ID ${trackId} ended successfully`);
          await sendStatistics(
            'StreamService',  
            {
              uid: uid,
              trackId: trackId, 
              timestamp: new Date().toISOString(),
            }
          );
          await sendStatistics(
            'TrackService',  
            {
              plays: 1,
              trackId: trackId
            }
          );
          await sendStatistics(
            'UserService',  
            {
              uid:uid,
              plays: 1,
              trackId: trackId
            }
          );
          isLogged = true;
        }
        call.end();
      });

      stream.on('error', async (err) => {
        if (!isLogged) {
          await logMessage('StreamService', 'ERROR', `Error streaming file for track ID ${trackId}: ${err.message}`);
          console.error('Error streaming file:', err);
          call.emit('error', {
            code: grpc.status.INTERNAL,
            message: 'Error streaming file',
          });
          isLogged = true;
        }
      });
    } catch (err) {
      if (!isLogged) {
        await logMessage('StreamService', 'ERROR', `Internal server error while streaming track ID ${trackId}: ${err.message}`);
        console.error('Internal server error:', err);
        isLogged = true;
      }
      call.emit('error', {
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  },
};
