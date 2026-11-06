import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

console.log("MCP SDK and Zod loaded");
const server = new McpServer({ name: "smoke", version: "0.0.1" });
console.log(server); // should print the server object
