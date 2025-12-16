/**
 * Study Buddy MCP Server - Supabase Edge Function Entry Point
 *
 * This is the Hono-based entry point for the MCP server running on Supabase Edge Functions.
 * It provides the same functionality as the Node.js server but adapted for Deno.
 */

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { Hono } from "hono";
import { StreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.20.0/server/streamableHttp.js";

import { extractBearerToken, validateToken, getWWWAuthenticateHeader } from "./src/auth.ts";
import { createAuthenticatedClient } from "./src/supabase.ts";
import { createMcpServer } from "./src/server.ts";
import { env } from "./src/env.ts";

const app = new Hono().basePath("/study-buddy");

console.log("SUPABASE_URL:", env.SUPABASE_URL);

// OAuth Protected Resource Metadata (RFC 9728)
// Uses AUTH_PUBLIC_URL for external-facing auth server URL
app.get("/.well-known/oauth-protected-resource", (c) =>
  c.json({
    resource: env.MCP_SERVER_URL,
    authorization_servers: [`${env.AUTH_PUBLIC_URL}/auth/v1`],
    scopes_supported: ["email", "profile"],
  })
);

// OAuth config for consent UI
app.get("/oauth/config.json", (c) =>
  c.json({
    supabaseUrl: env.AUTH_PUBLIC_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
  })
);

// Serve OAuth consent page inline (serveStatic doesn't work reliably in Edge Functions)
import { CONSENT_HTML } from "./src/consent-html.ts";
app.get("/oauth/consent", (c) => c.html(CONSENT_HTML));
app.get("/oauth/consent.html", (c) => c.html(CONSENT_HTML));

// MCP endpoint with authentication
app.post("/mcp", async (c) => {
  const token = extractBearerToken(c.req.header("Authorization"));

  if (!token) {
    return c.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Authentication required",
        },
        id: null,
      },
      401,
      {
        "WWW-Authenticate": getWWWAuthenticateHeader(),
      }
    );
  }

  try {
    const authContext = await validateToken(token);
    const supabase = createAuthenticatedClient(authContext.accessToken);

    // Create MCP server with context injection
    const server = createMcpServer(() => ({
      userId: authContext.userId,
      supabase,
    }));

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    const body = await c.req.json();
    return await transport.handleRequest(c.req.raw, undefined, body);
  } catch (error) {
    const isExpired = error instanceof Error && error.message.includes("exp");

    return c.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: isExpired ? "Token expired" : "Invalid token",
        },
        id: null,
      },
      401,
      {
        "WWW-Authenticate": getWWWAuthenticateHeader(
          "invalid_token",
          isExpired ? "Token expired" : "Invalid token"
        ),
      }
    );
  }
});

// Handle unsupported methods on /mcp
app.on(["GET", "DELETE"], "/mcp", (c) => {
  return c.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    },
    405
  );
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// ============================================
// Static file serving for widgets
// Uses Deno.readFile() with static_files config
// ============================================

// Serve widget JavaScript files
app.get("/widgets/:filename{.+\\.js$}", async (c) => {
  const filename = c.req.param("filename");
  try {
    const content = await Deno.readFile(`./widgets/${filename}`);
    return new Response(content, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return c.notFound();
  }
});

// Serve widget CSS
app.get("/widgets/style.css", async (c) => {
  try {
    const content = await Deno.readFile("./widgets/style.css");
    return new Response(content, {
      headers: {
        "Content-Type": "text/css",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return c.notFound();
  }
});

// Serve widget assets (shared chunks in assets/ directory)
app.get("/widgets/assets/:filename{.+\\.js$}", async (c) => {
  const filename = c.req.param("filename");
  try {
    const content = await Deno.readFile(`./widgets/assets/${filename}`);
    return new Response(content, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return c.notFound();
  }
});

// Export the fetch handler for Deno.serve
Deno.serve((req) => app.fetch(req));
