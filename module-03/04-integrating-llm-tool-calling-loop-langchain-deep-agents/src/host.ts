import { Client } from "@modelcontextprotocol/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { createDeepAgent } from "deepagents";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function main() {
  const client = new Client({ name: "deep-agent-host", version: "1.0.0" });

  const transport = new StreamableHTTPClientTransport(
    new URL("http://localhost:3000/mcp"),
  );

  await client.connect(transport);

  try {
    // Convert MCP tools into LangChain tools
    const tools = await loadMcpTools("catalog", client);
    console.log(
      "Loaded tools:",
      tools.map((t) => t.name),
    );

    const model = new ChatOpenAI({
      model: "deepseek/deepseek-v4.1-flash", // or any tool-calling model available on the gateway
      configuration: {
        baseURL: "https://api.llm-gateway.io/openai/v1",
        apiKey: process.env.LLM_GATEWAY_API_KEY,
      },
    });

    const agent = createDeepAgent({
      model,
      tools,
      systemPrompt:
        "You are a helpful catalog assistant. Always use the lookup-item tool when the user asks about a product.",
    });

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: "What is the price and stock status of SKU-42?",
        },
      ],
    });

    const last = result.messages.at(-1);
    console.log("nFinal answer:");
    console.log(last?.content ?? last);
  } finally {
    await transport.terminateSession().catch(() => {});
    await client.close();
  }
}

main().catch(console.error);
