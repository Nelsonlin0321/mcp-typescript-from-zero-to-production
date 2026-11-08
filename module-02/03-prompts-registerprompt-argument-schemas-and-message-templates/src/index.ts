import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

function createServer(): McpServer {
  const server = new McpServer({ name: "catalog", version: "1.0.0" });

  // 1. Simple code review
  server.registerPrompt(
    "review-code",
    {
      title: "Code Review",
      description: "Review code for best practices and potential issues",
      argsSchema: z.object({
        code: z.string().describe("The code to review"),
        language: z
          .string()
          .optional()
          .describe("Programming language (optional)"),
      }),
    },
    ({ code, language }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Review this${language ? ` ${language}` : ""} code for best practices, bugs, and improvements:\n\n${code}`,
          },
        },
      ],
    }),
  );

  // 2. Product summary with tone control
  server.registerPrompt(
    "summarize-product",
    {
      title: "Product Summary",
      description: "Generate a customer-facing product summary",
      argsSchema: z.object({
        sku: z.string().describe("Exact product SKU"),
        tone: z
          .enum(["professional", "casual", "terse"])
          .default("professional"),
        audience: z.string().optional().describe("Target audience"),
      }),
    },
    ({ sku, tone, audience }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Write a ${tone} product summary for SKU ${sku}${
              audience ? ` aimed at ${audience}` : ""
            }. Focus on benefits, not just features.`,
          },
        },
      ],
    }),
  );

  // 3. Error explanation that seeds the reply
  server.registerPrompt(
    "explain-error",
    {
      title: "Explain Error",
      description: "Explain an error and suggest the smallest fix",
      argsSchema: z.object({
        error: z.string().describe("Full error message and stack if available"),
      }),
    },
    ({ error }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Explain this error clearly and suggest the smallest possible fix:\n\n${error}`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: "The one-line cause:",
          },
        },
      ],
    }),
  );

  // 4. Incident triage (multi-message)
  server.registerPrompt(
    "triage-incident",
    {
      title: "Incident Triage",
      description: "Structure an incident report into next actions",
      argsSchema: z.object({
        summary: z.string().describe("What happened"),
        impact: z.string().describe("Who or what is affected"),
        logs: z.string().optional().describe("Relevant log snippets"),
      }),
    },
    ({ summary, impact, logs }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Incident summary:\n${summary}\n\nImpact:\n${impact}${
              logs ? `\n\nLogs:\n${logs}` : ""
            }\n\nProvide:\n1. Severity (P0–P3)\n2. Immediate next steps\n3. What to investigate first`,
          },
        },
      ],
    }),
  );

  return server;
}

const handle = serveStdio(createServer);
process.on("SIGINT", () => {
  void handle.close();
});

console.log("MCP server running on stdio");
