import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const catalog = [
  { name: "Espresso cup", price: 12, category: "drinkware" },
  { name: "Travel mug", price: 24, category: "drinkware" },
  { name: "Mug rack", price: 36, category: "storage" },
  { name: "Pour-over kettle", price: 48, category: "brewing" },
  { name: "Coffee scale", price: 32, category: "brewing" },
];

export function createServer(): McpServer {
  const server = new McpServer({
    name: "catalog-server",
    version: "1.0.0",
  });

  server.registerTool(
    "search-products",
    {
      description:
        "Search the product catalog by name substring and optional category",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("Substring to match against product names"),
        category: z
          .enum(["drinkware", "storage", "brewing"])
          .optional()
          .describe("Optional category filter"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Maximum number of results to return (default 10)"),
      }),
    },
    async ({ query, category, limit }) => {
      const q = query.toLowerCase();
      let hits = catalog.filter((p) => p.name.toLowerCase().includes(q));
      if (category) hits = hits.filter((p) => p.category === category);
      const results = hits.slice(0, limit ?? 10);

      if (results.length === 0) {
        return {
          content: [
            { type: "text", text: `No products found for "${query}".` },
          ],
        };
      }

      const lines = results.map(
        (p) => `${p.name} — $${p.price} (${p.category})`,
      );
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  return server;
}

// Entry point
const handle = serveStdio(createServer);
console.error("catalog MCP server running on stdio");

// Optional clean shutdown
process.on("SIGINT", () => {
  void handle.close();
});
