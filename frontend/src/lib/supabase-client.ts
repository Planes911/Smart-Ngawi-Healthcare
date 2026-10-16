/**
 * PuskesmasPintar - Supabase Client Bridge
 * Memungkinkan koneksi ke Supabase cloud jika env variable terpasang,
 * atau fallback transparan ke local store untuk demo offline hackathon.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

// Placeholder interface for Supabase client
export interface SupabaseClientPlaceholder {
  configured: boolean;
}

export const supabase: SupabaseClientPlaceholder = {
  configured: isSupabaseConfigured,
};
