import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

async function main() {
  const client = new Client({ name: "demo-client", version: "1.0.0" });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/server.ts"],
  });

  try {
    await client.connect(transport);

    console.log("Connected to:", client.getServerVersion());
    console.log("Capabilities:", client.getServerCapabilities());

    // List tools
    const { tools } = await client.listTools();
    console.log("\nTools:");
    for (const tool of tools) {
      console.log(`- ${tool.name}: ${tool.description ?? "(no description)"}`);
    }

    // Call a tool
    const result = await client.callTool({
      name: "echo",
      arguments: { message: "Hello from the client!" },
    });

    console.log("\nTool result:");
    for (const block of result.content) {
      if (block.type === "text") console.log(block.text);
    }
  } finally {
    // Always close — this terminates the child process cleanly
    await client.close();
  }
}

main().catch(console.error);
