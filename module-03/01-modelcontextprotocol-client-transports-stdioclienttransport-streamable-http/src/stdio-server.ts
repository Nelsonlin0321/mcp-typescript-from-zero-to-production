import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServerFactory } from "./factory";

const handle = serveStdio(createServerFactory);
process.on("SIGINT", () => {
  void handle.close();
});

console.log("MCP server running on stdio");
