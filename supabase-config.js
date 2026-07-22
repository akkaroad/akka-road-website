// Akka Road Supabase browser configuration.
// The publishable key is intentionally safe for client-side use; database security is enforced with RLS.
export const SUPABASE_URL = 'https://xbfzqzhquixiywdevdui.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_dpcuYTRWGg-8I9Yq4sM9PA_tWAZib-g';

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.endsWith('.supabase.co') &&
  SUPABASE_ANON_KEY.length > 40;
