import Router from 'koa-router';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import services from './serviceRegistry.js';
import { grpcMethodMapping } from './grpcMethodMapping.js';
import { logMessage } from './LogServices/log.js';

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
    //console.log(`Service: ${service}, Resource: ${resource}, ID: ${id}`);
    await logMessage('APIGateway', 'INFO', `Received request for ${service}/${resource}/${id}`);

    const serviceInfo = services[service];

    if (!serviceInfo) {
        ctx.status = 404;
        ctx.body = { error: 'Service not found' };
        await logMessage('APIGateway', 'ERROR', `Service not found: ${service}`);
        return;
    }

    const methodMapping = grpcMethodMapping[service]?.[resource];
    if (!methodMapping) {
        ctx.status = 404;
        ctx.body = { error: 'Resource not found' };
        await logMessage('APIGateway', 'ERROR', `Resource not found: ${resource}`);
        return;
    }

    const client = createGrpcClient(serviceInfo);

    const methodName = id 
        ? methodMapping[ctx.method]?.withId 
        : methodMapping[ctx.method]?.withoutId;
    //console.log("method name is:", methodName);

    if (!methodName) {
        ctx.status = 404;
        ctx.body = { error: 'Method not found' };
        await logMessage('APIGateway', 'ERROR', `Method not found`);
        return;
    }
    let requestPayload = { 
        uid: ctx.state.user.uid
    };
    if (service === 'track-service' || service === 'stream-service') {
        requestPayload = id ? Object.assign(requestPayload, { track_id: id }) : requestPayload;
    } else if (service === 'occupation-handler') {
        requestPayload = id ? Object.assign(requestPayload, { uid: id }) : requestPayload;
    } else {
        requestPayload = id ? Object.assign(requestPayload, { pid: id }) : requestPayload;
    }
    
    if (ctx.method === 'GET' && ctx.query) {
        Object.assign(requestPayload, ctx.query);
    }
    if (ctx.method === 'DELETE' && ctx.query) {
        Object.assign(requestPayload, ctx.query);
    }

    if (ctx.method === 'POST' || ctx.method === 'PUT') {
        Object.assign(requestPayload, ctx.request.body);
    }
    //console.log(`Request Payload: `, requestPayload);

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
        await logMessage('APIGateway', 'INFO', `Successfully processed request for ${service}/${resource}/${id}`);
    } catch (error) {
        ctx.status = error.code === grpc.status.NOT_FOUND ? 404 : 500;
        ctx.body = { error: error.details || 'Internal Server Error' };
        await logMessage('APIGateway', 'ERROR', `Error processing request for ${service}/${resource}/${id}: ${error.message}`);
    }
});

export default router;
