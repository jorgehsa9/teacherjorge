import { createClient } from '@supabase/supabase-js';

// Get and clean up the Supabase URL
const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://hbrnbhokvkfrptrhnkte.supabase.co';
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim();

// Get the anonymous key
export const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_h57fz_j-h5D7Yeubz1BMhA_bJZyFeit';

// Safely initialize the Supabase client
// If the key is not configured, we set it to null or log a warning rather than crashing
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn(
    "Supabase is not fully configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment secrets to enable direct Supabase sync."
  );
}

/**
 * Fetches the exact columns from the 'Students' table as structured in the user's Supabase dashboard:
 * Columns: name (Primary Key), email, level, status
 */
export async function fetchStudentsMinimal() {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }
  // Note the capital 'Students' to match the actual table name in Supabase
  const { data, error } = await supabase
    .from('Students')
    .select('name, email, level, status');
  
  if (error) {
    throw error;
  }

  // Map the results cleanly:
  // Since 'name' is the primary key and there's no 'id' column, we'll map 'id' to 'name' for frontend compatibility.
  return (data || []).map(student => ({
    id: student.name,
    name: student.name,
    email: student.email || '',
    status: (student.status || 'active').toLowerCase(), // map "Active" to "active" to align with UI expectations
    cefrLevel: student.level || 'B1'
  }));
}
