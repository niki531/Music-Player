import Router from 'koa-router';
import axios from 'axios';
import { services } from './serviceRegistry.js'; 


const router = new Router();

router.all('/:service/:resource/:id?', async (ctx) => {
    const { service, resource, id } = ctx.params;
    const serviceInfo = services[service];
    const query = ctx.querystring;  

    if (!serviceInfo) {
        ctx.status = 404;
        ctx.body = { error: 'Service not found' };
        return;
    }

    const url = `${serviceInfo.url}/${resource}${id ? '/' + id : ''}${query ? '?' + query : ''}`;
    //console.log('url is', url);

    try {
        const response = await axios({
            method: ctx.method.toLowerCase(),
            url: url,
            data: ctx.request.body,
            headers: { ...ctx.headers, 
                'X-User-UID': ctx.state.user?.uid, 
                'X-User-Username': ctx.state.user?.username, 
                'X-User-Subscribe': ctx.state.user?.subscribe,
                'X-Auth-Verified': 'true'
            },
            responseType: 'arraybuffer'
        });

        if (resource === 'image') {
            ctx.set('Content-Type', 'image/jpeg'); 
        } else if (resource === 'stream'){
            ctx.set('Content-Type', 'audio/mpeg'); 
        } else {
            ctx.set('Content-Type', response.headers['content-type']);
        }
        
        ctx.status = response.status; 
        ctx.body = Buffer.from(response.data, 'binary');
    } catch (error) {
        ctx.status = error.response ? error.response.status : 500;
        ctx.body = error.response ? error.response.data : { error: 'Internal Server Error' };
    }
});


export default router;
