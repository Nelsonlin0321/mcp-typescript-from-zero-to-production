import {
  completable,
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const languages = ["typescript", "javascript", "python", "rust", "go"];

const branchesByRepo: Record<string, string[]> = {
  "typescript-sdk": ["main", "release/1.x", "release/2.x"],
  "python-sdk": ["main", "release/1.x"],
  inspector: ["main"],
};

async function listRepos() {
  return Object.keys(branchesByRepo);
}

function createServer() {
  const server = new McpServer({ name: "catalog", version: "1.0.0" });

  // Prompt with simple + context-aware completions
  server.registerPrompt(
    "review-code",
    {
      title: "Code Review",
      description: "Review code in a chosen language",
      argsSchema: z.object({
        language: completable(
          z.string().describe("Programming language"),
          (value) => languages.filter((l) => l.startsWith(value)),
        ),
        repo: completable(z.string().describe("Repository"), async (value) =>
          (await listRepos()).filter((r) => r.startsWith(value)),
        ),
        branch: completable(z.string().describe("Branch"), (value, ctx) => {
          const repo = ctx?.arguments?.repo;
          if (!repo) return [];
          return (branchesByRepo[repo] ?? []).filter((b) =>
            b.startsWith(value),
          );
        }),
      }),
    },
    ({ language, repo, branch }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Review the ${language} code on ${repo}@${branch}.`,
          },
        },
      ],
    }),
  );

  // Resource template with completion
  server.registerResource(
    "readme",
    new ResourceTemplate("repo://{repo}/readme", {
      list: undefined,
      complete: {
        repo: async (value) =>
          (await listRepos()).filter((r) => r.startsWith(value)),
      },
    }),
    {
      title: "Repository README",
      description: "README for a repository",
      mimeType: "text/plain",
    },
    async (uri, { repo }) => ({
      contents: [{ uri: uri.href, text: `# ${repo}\n\nREADME content here.` }],
    }),
  );

  return server;
}

const handle = serveStdio(createServer);
process.on("SIGINT", () => {
  void handle.close();
});

console.log("MCP server running on stdio");
