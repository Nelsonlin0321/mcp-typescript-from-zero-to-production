import assert from "node:assert/strict";

import {
  Client,
  StreamableHTTPClientTransport,
  InMemoryTransport,
} from "@modelcontextprotocol/client";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

function createServer() {
  const server = new McpServer({ name: "pricing", version: "1.0.0" });

  server.registerTool(
    "apply-discount",
    {
      description: "Apply a percentage discount to a price",
      inputSchema: z.object({
        price: z.number(),
        percent: z.number().min(0).max(100),
      }),
      outputSchema: z.object({ total: z.number() }),
    },
    async ({ price, percent }) => {
      if (price < 0) {
        return {
          content: [{ type: "text", text: "price must be >= 0" }],
          isError: true,
        };
      }
      const total = price * (1 - percent / 100);
      return {
        content: [{ type: "text", text: `$${total.toFixed(2)}` }],
        structuredContent: { total },
      };
    },
  );

  return server;
}

async function testHandlerFetch() {
  const handler = createMcpHandler(createServer);

  const transport = new StreamableHTTPClientTransport(
    new URL("http://test.local/mcp"),
    {
      fetch: (url, init) => handler.fetch(new Request(url, init)),
    },
  );

  const client = new Client(
    { name: "test-harness", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } },
  );

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: "apply-discount",
      arguments: { price: 80, percent: 25 },
    });
    assert.deepStrictEqual(result.structuredContent, { total: 60 });
    assert.equal(result.isError, undefined); // or false

    const failed = await client.callTool({
      name: "apply-discount",
      arguments: { price: -5, percent: 25 },
    });
    assert.equal(failed.isError, true);

    console.log("handler.fetch path: OK");
  } finally {
    await client.close();
    await handler.close();
  }
}

async function testInMemory() {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const memServer = createServer();
  const memClient = new Client({ name: "test-harness", version: "1.0.0" });

  try {
    await memServer.connect(serverTransport);
    await memClient.connect(clientTransport);

    const result = await memClient.callTool({
      name: "apply-discount",
      arguments: { price: 80, percent: 25 },
    });
    assert.deepStrictEqual(result.structuredContent, { total: 60 });

    console.log("InMemoryTransport path: OK");
  } finally {
    await memClient.close();
    await memServer.close();
  }
}

async function main() {
  await testHandlerFetch();
  await testInMemory();
  console.log("All in-process / in-memory checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
