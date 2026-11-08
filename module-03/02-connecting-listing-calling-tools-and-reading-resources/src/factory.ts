import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export function createServer() {
  const server = new McpServer({
    name: "orders-demo",
    version: "1.0.0",
  });

  // Tool
  server.registerTool(
    "lookup-order",
    {
      description: "Look up an order by ID",
      inputSchema: z.object({
        id: z.string().describe("Order ID"),
      }),
    },
    async ({ id }) => ({
      content: [
        {
          type: "text",
          text: `Order ${id}: 3 items, shipped`,
        },
      ],
    }),
  );

  // Static resource
  server.registerResource(
    "recent",
    "orders://recent",
    {
      title: "Recent Orders",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(["A-1041", "A-1042"]),
        },
      ],
    }),
  );

  // Prompt
  server.registerPrompt(
    "summarize-order",
    {
      title: "Summarize Order",
      description: "Create a short status update for an order",
      argsSchema: z.object({
        id: z.string(),
        tone: z.string().optional(),
      }),
    },
    ({ id, tone }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Write a ${tone ?? "neutral"} status update for order ${id}.`,
          },
        },
      ],
    }),
  );

  return server;
}
