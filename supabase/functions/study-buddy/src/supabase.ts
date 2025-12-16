/**
 * Supabase client factory for Deno Edge Functions.
 * Accepts token as parameter instead of using AsyncLocalStorage.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "./env.ts";

/**
 * Create an authenticated Supabase client using the user's access token.
 * This client respects RLS policies based on the authenticated user.
 */
export function createAuthenticatedClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
