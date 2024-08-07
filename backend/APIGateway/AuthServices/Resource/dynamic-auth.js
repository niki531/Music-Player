export async function checkAccess(ctx, next) {
    const authAllowed = ctx.headers['x-auth-verified'] === 'true';
    if (!authAllowed) {
        ctx.status = 403;
        ctx.body = { error: 'Access denied' };
        return;
    }
    await next();  
}
