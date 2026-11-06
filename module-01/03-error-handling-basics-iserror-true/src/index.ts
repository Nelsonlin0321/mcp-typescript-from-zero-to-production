import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const catalog = [
  { id: "cup-01", name: "Espresso cup", price: 12 },
  { id: "mug-01", name: "Travel mug", price: 24 },
];

function createServer(): McpServer {
  const server = new McpServer({ name: "catalog-server", version: "1.0.0" });

  server.registerTool(
    "get-product",
    {
      description: "Look up one product by its exact id",
      inputSchema: z.object({
        id: z.string().describe("Product id, e.g. cup-01"),
      }),
    },
    async ({ id }) => {
      const product = catalog.find((p) => p.id === id);
      if (!product) {
        const known = catalog.map((p) => p.id).join(", ");
        return {
          content: [
            {
              type: "text",
              text: `No product with id "${id}". Known ids: ${known}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `${product.name} — $${product.price}`,
          },
        ],
      };
    },
  );

  return server;
}

const handle = serveStdio(createServer);

process.on("SIGINT", () => {
  void handle.close();
});

console.error("catalog MCP server running on stdio");
