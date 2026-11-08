import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export function createServerFactory() {
  const server = new McpServer({ name: "demo-server", version: "1.0.0" });

  server.registerTool(
    "echo",
    {
      description: "Echoes the provided message",
      inputSchema: z.object({ message: z.string() }),
    },
    async ({ message }) => ({
      content: [{ type: "text", text: `Echo: ${message}` }],
    }),
  );

  return server;
}
