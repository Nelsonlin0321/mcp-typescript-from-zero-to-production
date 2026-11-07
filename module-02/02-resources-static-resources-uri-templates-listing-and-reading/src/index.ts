import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";

interface Product {
  sku: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    sku: "CUP-ESPRESSO",
    name: "Espresso cup",
    price: 12,
    category: "drinkware",
    description: "Ceramic 60ml espresso cup",
  },
  {
    sku: "MUG-TRAVEL",
    name: "Travel mug",
    price: 24,
    category: "drinkware",
    description: "Insulated stainless travel mug",
  },
  {
    sku: "RACK-MUG",
    name: "Mug rack",
    price: 36,
    category: "storage",
    description: "Wooden mug rack, holds 6",
  },
];

const DOCS_ROOT = path.resolve("./docs");

function createServer(): McpServer {
  const server = new McpServer({ name: "catalog", version: "1.0.0" });

  // 1. Static configuration resource
  server.registerResource(
    "config",
    "config://app",
    {
      title: "Catalog Config",
      description: "Current catalog settings",
      mimeType: "text/plain",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: "currency=USD\ntax_rate=0.08\nregion=us-west-2\nversion=1.2.0",
        },
      ],
    }),
  );

  // 2. Static summary of all products
  server.registerResource(
    "product-index",
    "catalog://products",
    {
      title: "Product Index",
      description: "All products (SKU + name + price)",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            PRODUCTS.map((p) => ({ sku: p.sku, name: p.name, price: p.price })),
            null,
            2,
          ),
        },
      ],
    }),
  );

  // 3. Templated product detail (enumerable so it shows in resources/list)
  server.registerResource(
    "product",
    new ResourceTemplate("products://{sku}", {
      list: async () => ({
        resources: PRODUCTS.map((p) => ({
          uri: `products://${p.sku}`,
          name: p.name,
          description: p.description,
          mimeType: "application/json",
        })),
      }),
    }),
    {
      title: "Product Details",
      description: "Full product record by SKU",
      mimeType: "application/json",
    },
    async (uri, { sku }) => {
      const product = PRODUCTS.find((p) => p.sku === sku);
      if (!product) {
        throw new Error(`Product not found: ${sku}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(product, null, 2),
          },
        ],
      };
    },
  );

  // 4. File-backed documentation resource (safe path handling)
  server.registerResource(
    "doc",
    new ResourceTemplate("docs://{file}", {
      list: async () => {
        const entries = await readdir(DOCS_ROOT, { withFileTypes: true });
        return {
          resources: entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
            .map((entry) => ({
              uri: `docs://${entry.name}`,
              name: entry.name,
              mimeType: "text/markdown",
            })),
        };
      },
    }),
    {
      title: "Documentation",
      description: "A markdown file from the docs directory",
      mimeType: "text/markdown",
    },
    async (uri, { file }) => {
      const requested = await realpath(path.join(DOCS_ROOT, String(file)));
      if (!requested.startsWith(DOCS_ROOT + path.sep)) {
        throw new Error(`${uri.href} resolves outside the docs root`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: await readFile(requested, "utf8"),
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

console.error("Catalog MCP server running on stdio");
