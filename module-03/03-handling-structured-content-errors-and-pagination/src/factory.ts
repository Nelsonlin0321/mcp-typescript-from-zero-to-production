import {
  McpServer,
  ResourceNotFoundError,
  ResourceTemplate,
} from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const orders = new Map([
  ["A-1041", { id: "A-1041", total: 61.5, currency: "EUR", status: "shipped" }],
  ["A-1042", { id: "A-1042", total: 24.0, currency: "USD", status: "pending" }],
]);

export function createServer() {
  const server = new McpServer({
    name: "orders-demo",
    version: "1.0.0",
  });

  // Tool with structured output
  server.registerTool(
    "order-total",
    {
      description: "Get the total for an order",
      inputSchema: z.object({ id: z.string() }),
      outputSchema: z.object({
        id: z.string(),
        total: z.number(),
        currency: z.string(),
      }),
    },
    async ({ id }) => {
      const order = orders.get(id);
      if (!order) {
        return {
          content: [{ type: "text", text: `No order with id "${id}"` }],
          isError: true,
        };
      }
      const output = {
        id: order.id,
        total: order.total,
        currency: order.currency,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Tool that can fail with isError
  server.registerTool(
    "lookup-order",
    {
      description: "Look up full order details",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const order = orders.get(id);
      if (!order) {
        return {
          content: [
            {
              type: "text",
              text: `Order "${id}" not found. Known ids: ${[...orders.keys()].join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `${order.id}: ${order.total} ${order.currency} (${order.status})`,
          },
        ],
      };
    },
  );

  // Resource that throws a protocol error for unknown URIs
  server.registerResource(
    "order",
    new ResourceTemplate("order://{id}", { list: undefined }),
    { description: "Full order as JSON", mimeType: "application/json" },
    async (uri, { id }) => {
      const order = orders.get(String(id));
      if (!order) {
        throw new ResourceNotFoundError(uri.href);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(order),
          },
        ],
      };
    },
  );

  return server;
}
