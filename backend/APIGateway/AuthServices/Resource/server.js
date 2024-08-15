import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import zookeeper from 'node-zookeeper-client';
import { AlbumService } from './album-services/albumService.js';
import { ImageService } from './image-services/imageService.js';
import { PlaylistService } from './playlist-services/playlistService.js';
import { TrackService } from './track-services/trackService.js';
import { UserLibraryService } from './user-library-services/libraryService.js';
import { fileURLToPath } from 'url';
import path from 'path';

const ZK_ADDRESS = 'localhost:2181';
const SERVICE_NAME = '/services/ResourceService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const albumProtoPath = path.resolve(__dirname,  './album-services/album.proto');
const imageProtoPath = path.resolve(__dirname, './image-services/image.proto');
const playlistProtoPath = path.resolve(__dirname, './playlist-services/playlist.proto');
const trackProtoPath = path.resolve(__dirname, './track-services/track.proto');
const libraryProtoPath = path.resolve(__dirname, './user-library-services/library.proto');

const albumPackageDefinition = protoLoader.loadSync(albumProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const imagePackageDefinition = protoLoader.loadSync(imageProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const playlistPackageDefinition = protoLoader.loadSync(playlistProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const trackPackageDefinition = protoLoader.loadSync(trackProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userLibraryPackageDefinition = protoLoader.loadSync(libraryProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const albumProto = grpc.loadPackageDefinition(albumPackageDefinition).AlbumService;
const imageProto = grpc.loadPackageDefinition(imagePackageDefinition).ImageService;
const playlistProto = grpc.loadPackageDefinition(playlistPackageDefinition).PlaylistService;
const trackProto = grpc.loadPackageDefinition(trackPackageDefinition).TrackService;
const userLibraryProto = grpc.loadPackageDefinition(userLibraryPackageDefinition).UserLibraryService;

function startGrpcServer() {
  const server = new grpc.Server();

  server.addService(albumProto.service, AlbumService);
  server.addService(imageProto.service, ImageService);
  server.addService(playlistProto.service, PlaylistService);
  server.addService(trackProto.service, TrackService);
  server.addService(userLibraryProto.service, UserLibraryService);


  const SERVICE_ADDRESS = 'localhost:50052';

  server.bindAsync(SERVICE_ADDRESS, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`gRPC Server running at ${SERVICE_ADDRESS}`);
    registerServiceInZookeeper(SERVICE_NAME, SERVICE_ADDRESS);
  });
}

function createPathRecursive(client, path, callback) {
    const paths = path.split('/').filter(Boolean);
    let currentPath = '';
  
    function createNext(index) {
      if (index >= paths.length) {
        return callback();
      }
  
      currentPath += `/${paths[index]}`;
      client.exists(currentPath, (err, stat) => {
        if (err) {
          return callback(err);
        }
  
        if (stat) {
          createNext(index + 1);
        } else {
          client.create(currentPath, (err) => {
            if (err) {
              return callback(err);
            }
            createNext(index + 1);
          });
        }
      });
    }
  
    createNext(0);
  }
  
  function registerServiceInZookeeper(serviceName, serviceAddress) {
    const client = zookeeper.createClient(ZK_ADDRESS);
  
    client.once('connected', () => {
      console.log('Connected to ZooKeeper.');
  
      createPathRecursive(client, serviceName, (err) => {
        if (err) {
          console.error('Failed to create path in ZooKeeper:', err);
          client.close();
          return;
        }
  
        const path = `${serviceName}/${serviceAddress.replace(':', '-')}`;
        
        client.create(path, zookeeper.CreateMode.PERSISTENT, (error) => {
          if (error) {
            console.error('Failed to register service in ZooKeeper:', error);
          } else {
            console.log(`Service registered in ZooKeeper at path: ${path}`);
          }
          client.close();
        });
      });
    });
  
    client.connect();
  }
startGrpcServer();
