import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx tsx",
  args: ["src/stdio/server.ts"],
});

const client = new Client({
  name: "stdio-client",
  version: "1.0.0"
});

async function main() {
  await client.connect(transport);

  // Test the add tool
  console.log("Testing add tool:");
  const addResult = await client.callTool({
    name: "add",
    arguments: {
      a: 4,
      b: 4,
    }
  });
  console.log("4 + 4 =", addResult);

  // Test the greeting resource
  console.log("\nTesting greeting resource:");
  const resource = await client.readResource({
    uri: "greeting://Lucy"
  });
  console.log("Greeting:", resource);
}

main().catch(console.error);