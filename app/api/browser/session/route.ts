import { auth } from '@/lib/auth';
import { browserApiOk, browserApiUnauthorized, browserApiError } from '@/lib/browser-api/response';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return browserApiUnauthorized();
    }

    return browserApiOk({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      }
    });
  } catch (error) {
    return browserApiError('Session check failed');
  }
}
