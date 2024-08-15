import Router from 'koa-router';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import services from './serviceRegistry.js';
import { grpcMethodMapping } from './grpcMethodMapping.js';

const router = new Router();

const loadProto = (service) => {
    const packageDefinition = protoLoader.loadSync(service.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });

    if (service.package === '') {
        return grpc.loadPackageDefinition(packageDefinition);
    } else {
        return grpc.loadPackageDefinition(packageDefinition)[service.package];
    }
};

const createGrpcClient = (serviceInfo) => {
    const proto = loadProto(serviceInfo);

    // console.log(`Loaded proto: `, proto);
    // console.log(`Service name: `, serviceInfo.serviceName);
    // console.log(`Available services: `, Object.keys(proto));

    if (!proto[serviceInfo.serviceName]) {
        throw new Error(`Service ${serviceInfo.serviceName} not found in proto file`);
    }

    return new proto[serviceInfo.serviceName](serviceInfo.address, grpc.credentials.createInsecure());
};

router.all('/:service/:resource/:id?', async (ctx) => {
    const { service, resource, id } = ctx.params;
    console.log(`Service: ${service}, Resource: ${resource}, ID: ${id}`);

    const serviceInfo = services[service];

    if (!serviceInfo) {
        ctx.status = 404;
        ctx.body = { error: 'Service not found' };
        return;
    }

    const methodMapping = grpcMethodMapping[service]?.[resource];
    if (!methodMapping) {
        ctx.status = 404;
        ctx.body = { error: 'Resource not found' };
        return;
    }

    const client = createGrpcClient(serviceInfo);

    const methodName = id 
        ? methodMapping[ctx.method]?.withId 
        : methodMapping[ctx.method]?.withoutId;

    if (!methodName) {
        ctx.status = 404;
        ctx.body = { error: 'Method not found' };
        return;
    }

    let requestPayload;
    if (service === 'track-service' || service === 'stream-service') {
        requestPayload = id ? { track_id: id } : {}; 
    } else if (service === 'occupation-handler') {
        requestPayload = id ? { uid: id } : {}; 
    } else {
        requestPayload = id ? { pid: id } : {};
    }
    console.log(`Request Payload: `, requestPayload);
    
    if (ctx.method === 'GET' && ctx.query) {
        Object.assign(requestPayload, ctx.query);
    }

    if (ctx.method === 'POST' || ctx.method === 'PUT') {
        Object.assign(requestPayload, ctx.request.body);
    }

    try {
        if (methodName === 'StreamTrackById') {
            const call = client[methodName](requestPayload);
            ctx.set('Content-Type', 'audio/mpeg'); 

            let chunks = [];
            call.on('data', (response) => {
                //console.log('Received data chunk:', response.data.length);
                chunks.push(response.data); 
            });

            await new Promise((resolve, reject) => {
                call.on('end', () => {
                    ctx.body = Buffer.concat(chunks);
                    //console.log('Streaming finished. ctx.body length is', ctx.body.length);
                    resolve();  
                });
    
                call.on('error', (err) => {
                    console.error('Error during streaming:', err);
                    ctx.status = err.code === grpc.status.NOT_FOUND ? 404 : 500;
                    ctx.body = { error: err.details || 'Internal Server Error' };
                    reject(err);  
                });
            });
        } else if (methodName === 'GetAlbumCover') {
            const response = await new Promise((resolve, reject) => {
                client[methodName](requestPayload, (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });
        
            ctx.set('Content-Type', 'image/jpeg'); 
            ctx.status = 200;
            ctx.body = response.image_data;
        } else {
            const response = await new Promise((resolve, reject) => {
                client[methodName](requestPayload, (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            ctx.status = 200;
            ctx.body = response;
        }
    } catch (error) {
        ctx.status = error.code === grpc.status.NOT_FOUND ? 404 : 500;
        ctx.body = { error: error.details || 'Internal Server Error' };
    }
});

export default router;
