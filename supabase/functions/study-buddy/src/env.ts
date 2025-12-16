/**
 * Environment variable validation for Deno Edge Functions.
 * Replaces t3-env with direct Deno.env access.
 */

function getEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvOptional(key: string, defaultValue: string): string {
  return Deno.env.get(key) ?? defaultValue;
}

export const env = {
  get NODE_ENV(): "development" | "production" | "test" {
    const value = getEnvOptional("NODE_ENV", "development");
    if (value !== "development" && value !== "production" && value !== "test") {
      return "development";
    }
    return value;
  },
  /**
   * Internal Supabase URL for server-to-server communication.
   * In Edge Functions, this is auto-injected as http://kong:8000 (Docker internal).
   * Use this for database/auth operations from within the function.
   */
  get SUPABASE_URL(): string {
    return getEnv("SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY(): string {
    return getEnv("SUPABASE_ANON_KEY");
  },
  get MCP_SERVER_URL(): string {
    return getEnv("MCP_SERVER_URL");
  },
  /**
   * Public-facing Supabase URL for OAuth metadata.
   * This URL must be accessible from outside (MCP clients, browsers).
   * Named AUTH_PUBLIC_URL because Supabase blocks env vars starting with SUPABASE_.
   * Falls back to SUPABASE_URL if not set (works in production where SUPABASE_URL is public).
   */
  get AUTH_PUBLIC_URL(): string {
    return getEnvOptional("AUTH_PUBLIC_URL", Deno.env.get("SUPABASE_URL") ?? "");
  },
};
