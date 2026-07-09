import { createClient } from '@supabase/supabase-js';

// These should be environment variables in production (.env.local)
// We provide dummy values for the boilerplate to compile
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Secondary client specifically for creating new user accounts (Auth)
// without dropping the current user's (Teacher's) session.
export const secondarySupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
