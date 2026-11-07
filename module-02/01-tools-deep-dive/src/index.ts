import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const catalog = [
  { id: "1", name: "Espresso cup", price: 12, category: "drinkware" },
  { id: "2", name: "Travel mug", price: 24, category: "drinkware" },
  { id: "3", name: "Mug rack", price: 36, category: "storage" },
];

function createServer(): McpServer {
  const server = new McpServer({ name: "catalog-server", version: "1.0.0" });

  // Structured output
  server.registerTool(
    "get-product",
    {
      title: "Get Product",
      description: "Look up a product by ID",
      inputSchema: z.object({
        id: z.string().describe("Product ID"),
      }),
      outputSchema: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const product = catalog.find((p) => p.id === id);
      if (!product) {
        return {
          content: [{ type: "text", text: `Product ${id} not found` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
        structuredContent: product,
      };
    },
  );

  // Destructive write
  server.registerTool(
    "delete-product",
    {
      title: "Delete Product",
      description: "Permanently remove a product by ID",
      inputSchema: z.object({ id: z.string() }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const idx = catalog.findIndex((p) => p.id === id);
      if (idx === -1) {
        return {
          content: [{ type: "text", text: `Product ${id} not found` }],
          isError: true,
        };
      }
      catalog.splice(idx, 1);
      return { content: [{ type: "text", text: `Deleted product ${id}` }] };
    },
  );

  return server;
}

const handle = serveStdio(createServer);

process.on("SIGINT", () => {
  void handle.close();
});

console.error("Product MCP server running on stdio");
