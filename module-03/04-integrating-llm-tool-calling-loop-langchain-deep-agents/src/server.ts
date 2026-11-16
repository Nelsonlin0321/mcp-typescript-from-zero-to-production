import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "@modelcontextprotocol/server";
import {
  toNodeHandler,
  localhostHostValidation,
  localhostOriginValidation,
} from "@modelcontextprotocol/node";
import { z } from "zod";

function createServerFactory() {
  const server = new McpServer({ name: "catalog-server", version: "1.0.0" });

  server.registerTool(
    "lookup-item",
    {
      title: "Look up catalog item",
      description: "Return price and stock for a product id",
      inputSchema: z.object({
        id: z.string().describe("Product id, e.g. SKU-42"),
      }),
      outputSchema: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        inStock: z.boolean(),
      }),
    },
    async ({ id }) => {
      // demo data
      const items: Record<
        string,
        { name: string; price: number; inStock: boolean }
      > = {
        "SKU-42": { name: "Wireless Keyboard", price: 79.99, inStock: true },
        "SKU-7": { name: "USB-C Hub", price: 34.5, inStock: false },
      };
      const item = items[id];
      if (!item) {
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown product ${id}` }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ id, ...item }) }],
        structuredContent: { id, ...item },
      };
    },
  );

  return server;
}

const handler = createMcpHandler(createServerFactory);
const nodeHandler = toNodeHandler(handler);

const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

createServer((req, res) => {
  if (!validateHost(req, res) || !validateOrigin(req, res)) return;
  void nodeHandler(req, res);
}).listen(3000, "127.0.0.1", () => {
  console.log("MCP server listening on http://127.0.0.1:3000/mcp");
});
