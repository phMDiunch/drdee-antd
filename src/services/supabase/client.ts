import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // Note: Not using flowType: 'pkce' for password reset compatibility
    // PKCE requires code_verifier in same browser session, but email links
    // open in new tabs/browsers where verifier is not available
  );
}
