export const services = {}; 

export default function registerService(ctx, next) {
    if (ctx.path === '/register' && ctx.method === 'POST') {
        const serviceData = ctx.request.body;
        services[serviceData.name] = serviceData; 
        ctx.body = { message: 'Service registered successfully' };
    } else {
        return next();
    }
}
