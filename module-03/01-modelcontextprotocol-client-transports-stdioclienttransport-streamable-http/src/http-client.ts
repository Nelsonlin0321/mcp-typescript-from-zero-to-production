import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

async function main() {
  const client = new Client({ name: "remote-demo", version: "1.0.0" });

  const transport = new StreamableHTTPClientTransport(
    new URL("http://localhost:3000/mcp"),
  );

  try {
    await client.connect(transport);

    console.log("Connected to:", client.getServerVersion());

    const { tools } = await client.listTools();
    console.log(
      "Tools:",
      tools.map((t: { name: any }) => t.name),
    );

    const result = await client.callTool({
      name: "echo",
      arguments: { message: "Hello over HTTP" },
    });

    console.log(result.content);
  } finally {
    // terminateSession is safe even if the server is stateless
    await transport.terminateSession().catch(() => {});
    await client.close();
  }
}

main().catch(console.error);
