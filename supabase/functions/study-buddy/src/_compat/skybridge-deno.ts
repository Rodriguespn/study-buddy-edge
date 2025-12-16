/**
 * Deno-compatible Skybridge McpServer adapter.
 *
 * This provides the same widget() API as Skybridge but works in Deno Edge Functions.
 * It wraps the MCP SDK's McpServer and adds widget support.
 */

import { McpServer as BaseMcpServer } from "npm:@modelcontextprotocol/sdk@1.20.0/server/mcp.js";
import type {
  CallToolResult,
  GetPromptResult,
} from "npm:@modelcontextprotocol/sdk@1.20.0/types.js";
import type { ZodRawShape } from "zod";

import { renderWidgetHtml } from "./templates.ts";
import { env } from "../env.ts";

type ToolHandler<T = unknown> = (input: T) => Promise<CallToolResult>;
type PromptHandler = () => GetPromptResult;

interface WidgetResourceOptions {
  description: string;
}

interface WidgetToolOptions {
  description: string;
  inputSchema: ZodRawShape;
}

/**
 * Deno-compatible McpServer that provides the same widget() API as Skybridge.
 */
export class McpServer {
  private server: BaseMcpServer;
  private serverUrl: string;

  constructor(
    serverInfo: { name: string; version: string },
    options: { capabilities: Record<string, unknown> }
  ) {
    this.server = new BaseMcpServer(serverInfo, options);
    this.serverUrl = env.MCP_SERVER_URL;
  }

  /**
   * Register a widget with both resource (HTML) and tool capabilities.
   * Mimics Skybridge's widget() method.
   */
  widget<T extends ZodRawShape>(
    name: string,
    resourceOptions: WidgetResourceOptions,
    toolOptions: WidgetToolOptions,
    handler: ToolHandler
  ): void {
    // Register resource for widget HTML
    this.server.resource(
      name,
      `widget://${name}`,
      {
        description: resourceOptions.description,
        mimeType: "text/html+skybridge",
      },
      () => ({
        contents: [
          {
            uri: `widget://${name}`,
            mimeType: "text/html+skybridge",
            text: renderWidgetHtml(this.serverUrl, name),
          },
        ],
      })
    );

    // Register tool with openai/outputTemplate metadata
    this.server.tool(
      name,
      toolOptions.description,
      toolOptions.inputSchema,
      async (input: Record<string, unknown>) => {
        const result = await handler(input as T);
        return {
          ...result,
          _meta: {
            "openai/outputTemplate": {
              uri: `widget://${name}`,
              mimeType: "text/html+skybridge",
            },
          },
        };
      }
    );
  }

  /**
   * Register a tool (pass-through to base McpServer).
   */
  tool<T extends ZodRawShape>(
    name: string,
    description: string,
    inputSchema: T,
    handler: ToolHandler
  ): void {
    this.server.tool(
      name,
      description,
      inputSchema,
      handler as (input: Record<string, unknown>) => Promise<CallToolResult>
    );
  }

  /**
   * Register a prompt (pass-through to base McpServer).
   */
  prompt(name: string, description: string, handler: PromptHandler): void {
    this.server.prompt(name, description, handler);
  }

  /**
   * Connect to a transport.
   */
  async connect(transport: unknown): Promise<void> {
    await this.server.connect(transport as Parameters<BaseMcpServer["connect"]>[0]);
  }

  /**
   * Close the server.
   */
  async close(): Promise<void> {
    await this.server.close();
  }
}
