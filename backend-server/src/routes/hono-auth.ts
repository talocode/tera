import { Hono } from 'hono';
import { supabase } from '../services/supabase.js';

const router = new Hono();

// Google OAuth callback handler
router.post('/google', async (c: any) => {
  try {
    const { idToken } = await c.req.json();

    if (!idToken) {
      return c.json({
        success: false,
        error: 'idToken is required',
      }, 400);
    }

    // Sign in with Google ID token via Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.error('Auth error:', error);
      return c.json({
        success: false,
        error: 'Authentication failed',
      }, 401);
    }

    if (!data.user || !data.session) {
      return c.json({
        success: false,
        error: 'Authentication failed: No user or session',
      }, 401);
    }

    return c.json({
      success: true,
      data: {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          provider: 'google',
        },
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return c.json({
      success: false,
      error: 'Authentication error',
    }, 500);
  }
});

// Email/password sign in
router.post('/signin', async (c: any) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({
        success: false,
        error: 'Email and password are required',
      }, 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return c.json({
        success: false,
        error: 'Invalid email or password',
      }, 401);
    }

    if (!data.user || !data.session) {
      return c.json({
        success: false,
        error: 'Sign in failed',
      }, 401);
    }

    return c.json({
      success: true,
      data: {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          provider: 'email',
        },
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return c.json({
      success: false,
      error: 'Sign in failed',
    }, 500);
  }
});

// Email/password sign up
router.post('/signup', async (c: any) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({
        success: false,
        error: 'Email and password are required',
      }, 400);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error);
      return c.json({
        success: false,
        error: error.message || 'Sign up failed',
      }, 400);
    }

    if (!data.user) {
      return c.json({
        success: false,
        error: 'Sign up failed',
      }, 400);
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name || email.split('@')[0],
          provider: 'email',
        },
        message: 'Sign up successful. Please check your email to confirm your account.',
      },
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return c.json({
      success: false,
      error: 'Sign up failed',
    }, 500);
  }
});

// Sign out
router.post('/signout', async (c: any) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return c.json({
        success: false,
        error: 'Sign out failed',
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Sign out failed',
    }, 500);
  }
});

export default router;
