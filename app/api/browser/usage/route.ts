import { auth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { browserApiOk, browserApiUnauthorized, browserApiError } from '@/lib/browser-api/response';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return browserApiUnauthorized();
    }

    // Get user's usage data
    const { data: userData, error } = await supabaseServer
      .from('users')
      .select('subscription_plan, daily_chats, monthly_file_uploads, free_plan_credits_used')
      .eq('id', session.user.id)
      .single();

    if (error) {
      return browserApiError('Usage check failed');
    }

    return browserApiOk({
      plan: userData.subscription_plan,
      usage: {
        dailyChats: userData.daily_chats,
        monthlyFileUploads: userData.monthly_file_uploads,
        creditsUsed: userData.free_plan_credits_used,
        creditsRemaining: Math.max(0, 100 - userData.free_plan_credits_used)
      }
    });
  } catch (error) {
    return browserApiError('Usage check failed');
  }
}
