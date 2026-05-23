import { jwtVerify } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
}

export async function honoAuthMiddleware(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return c.json({
        success: false,
        error: 'No authorization token provided',
      }, 401);
    }

    try {
      const { payload } = await jwtVerify(token, getSecret());
      c.set('user', payload);
      await next();
    } catch {
      return c.json({
        success: false,
        error: 'Invalid or expired token',
      }, 401);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: 'Authentication error',
    }, 500);
  }
}

export async function honoOptionalAuth(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        const { payload } = await jwtVerify(token, getSecret());
        c.set('user', payload);
      } catch {
        // Silently fail
      }
    }
    await next();
  } catch {
    await next();
  }
}
