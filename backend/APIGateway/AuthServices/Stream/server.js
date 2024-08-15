import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import zookeeper from 'node-zookeeper-client';
import { StreamService } from './stream-services/streamService.js';
import { OccupationHandler } from './occupation-handler/occupationHandler.js';
import { fileURLToPath } from 'url';
import path from 'path';

const ZK_ADDRESS = 'localhost:2181';
const SERVICE_NAME = '/services/StreamService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const streamProtoPath = path.resolve(__dirname,  './stream-services/stream.proto');
const occupationProtoPath = path.resolve(__dirname, './occupation-handler/occupation.proto');

const streamPackageDefinition = protoLoader.loadSync(streamProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const occupationPackageDefinition = protoLoader.loadSync(occupationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const streamProto = grpc.loadPackageDefinition(streamPackageDefinition).StreamService;
const occupationProto = grpc.loadPackageDefinition(occupationPackageDefinition).OccupationHandler;

function startGrpcServer() {
  const server = new grpc.Server();

  server.addService(streamProto.service, StreamService);
  server.addService(occupationProto.service, OccupationHandler);


  const SERVICE_ADDRESS = 'localhost:50053';

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
