export default async function checkAccess(ctx, next) {
    const authAllowed = (ctx.headers['x-auth-verified'] === 'true') && (ctx.headers['x-user-subscribe'] === 'premium');
    if (!authAllowed) {
        ctx.status = 403;
        ctx.body = { error: 'Access denied' };
        return;
    }
    await next();  
}
