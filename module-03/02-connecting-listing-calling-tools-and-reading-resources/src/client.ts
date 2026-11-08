import type { Tool, Resource, Prompt } from "@modelcontextprotocol/client";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

async function main() {
  const client = new Client({ name: "orders-client", version: "1.0.0" });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/stdio-server.ts"],
  });

  try {
    await client.connect(transport);

    console.log("Connected to:", client.getServerVersion());
    console.log("Capabilities:", client.getServerCapabilities());

    // List everything
    const { tools } = await client.listTools();
    const { resources } = await client.listResources();
    const { prompts } = await client.listPrompts();

    console.log(
      "\nTools:",
      tools.map((t: Tool) => t.name),
    );
    console.log(
      "Resources:",
      resources.map((r: Resource) => r.uri),
    );
    console.log(
      "Prompts:",
      prompts.map((p: Prompt) => p.name),
    );

    // Call a tool
    const toolResult = await client.callTool({
      name: "lookup-order",
      arguments: { id: "A-1041" },
    });

    if (toolResult.isError) {
      console.error("Tool error:", toolResult.content);
    } else {
      console.log("\nTool result:");
      for (const block of toolResult.content) {
        if (block.type === "text") console.log(block.text);
      }
    }

    // Read a resource
    const { contents } = await client.readResource({
      uri: "orders://recent",
    });
    console.log("\nResource contents:", contents[0]?.text);

    // Get a prompt
    const prompt = await client.getPrompt({
      name: "summarize-order",
      arguments: { id: "A-1041", tone: "terse" },
    });
    console.log("\nPrompt messages:", prompt.messages);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
