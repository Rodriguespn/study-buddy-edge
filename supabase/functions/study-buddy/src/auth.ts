/**
 * Authentication utilities for Deno Edge Functions.
 * Removes AsyncLocalStorage dependency - uses context passing instead.
 */

import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";

import { env } from "./env.ts";

/**
 * User context extracted from validated JWT token
 */
export interface AuthContext {
  /** User ID from the JWT 'sub' claim */
  userId: string;
  /** OAuth client ID (null for direct user sessions) */
  clientId: string | null;
  /** User's email (if available) */
  email?: string;
  /** Raw access token for Supabase client authentication */
  accessToken: string;
}

/**
 * Supabase JWT payload structure
 */
interface SupabaseJWTPayload extends JWTPayload {
  sub: string;
  email?: string;
  client_id?: string;
  role?: string;
  aal?: string;
  session_id?: string;
}

/**
 * Get the JWKS (JSON Web Key Set) for token validation.
 */
function getJWKS() {
  const jwksUrl = new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
  return createRemoteJWKSet(jwksUrl);
}

/**
 * Validate a JWT access token and extract user context.
 *
 * @param token - The Bearer token from the Authorization header
 * @returns AuthContext with user information
 * @throws Error if token is invalid, expired, or has wrong issuer/audience
 */
export async function validateToken(token: string): Promise<AuthContext> {
  try {
    const { payload } = await jwtVerify<SupabaseJWTPayload>(token, getJWKS(), {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    });

    if (!payload.sub) {
      throw new Error("Token missing 'sub' claim");
    }

    return {
      userId: payload.sub,
      clientId: payload.client_id ?? null,
      email: payload.email,
      accessToken: token,
    };
  } catch (error) {
    console.error("Token validation failed:", error);
    console.error("Expected issuer:", `${env.SUPABASE_URL}/auth/v1`);
    throw error;
  }
}

/**
 * Extract Bearer token from Authorization header.
 *
 * @param authHeader - The Authorization header value
 * @returns The token string or null if not a valid Bearer token
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Generate the WWW-Authenticate header value for 401 responses.
 * This header tells MCP clients where to find the OAuth server.
 */
export function getWWWAuthenticateHeader(error?: string, errorDescription?: string): string {
  const resourceMetadataUrl = `${env.MCP_SERVER_URL}/.well-known/oauth-protected-resource`;
  let header = `Bearer resource_metadata="${resourceMetadataUrl}"`;

  if (error) {
    header += `, error="${error}"`;
    if (errorDescription) {
      header += `, error_description="${errorDescription}"`;
    }
  }

  return header;
}
