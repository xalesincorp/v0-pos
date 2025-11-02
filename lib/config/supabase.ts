import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Only initialize Supabase client if environment variables are set
let supabase;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase client initialized');
} else {
  console.warn('Supabase environment variables are not set. Authentication will not work.');
  // Create a mock client that handles requests gracefully when credentials are missing
  supabase = {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
        console.warn('Supabase not configured - returning mock response for signInWithPassword');
        return { data: { user: null, session: null }, error: { message: 'Supabase not configured' } };
      },
      signUp: async ({ email, password }: { email: string, password: string }) => {
        console.warn('Supabase not configured - returning mock response for signUp');
        return { data: { user: null, session: null }, error: { message: 'Supabase not configured' } };
      },
      signOut: async () => {
        console.warn('Supabase not configured - returning mock response for signOut');
        return { error: null };
      },
      getSession: async () => {
        console.warn('Supabase not configured - returning mock response for getSession');
        return { data: { session: null }, error: null };
      },
      getUser: async () => {
        console.warn('Supabase not configured - returning mock response for getUser');
        return { data: { user: null }, error: null };
      },
      resetPasswordForEmail: async (email: string) => {
        console.warn('Supabase not configured - returning mock response for resetPasswordForEmail');
        return { error: null };
      },
      updateUser: async (attributes: any) => {
        console.warn('Supabase not configured - returning mock response for updateUser');
        return { data: { user: null }, error: { message: 'Supabase not configured' } };
      },
      onAuthStateChange: (callback: any) => {
        console.warn('Supabase not configured - returning mock response for onAuthStateChange');
        // Return a mock subscription object with the expected structure
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
  };
}

// Create a separate client instance for auth management
export const authService = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  },
  
 // Sign up with email and password
  signUp: async (email: string, password: string, options?: { data: Record<string, any> }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: options || { data: {} },
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  },
  
  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  },
  
  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return data.session;
  },
  
  // Get user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return data.user;
  },
  
  // Reset password
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw error;
    }
  },
  
 // Update user
  updateUser: async (attributes: { data?: Record<string, any>, password?: string, email?: string }) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    
    if (error) {
      throw error;
    }
    
    return data.user;
  },
  
  // Listen to auth state changes
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
  }
};