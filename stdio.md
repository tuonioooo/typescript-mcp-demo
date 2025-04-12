# Stdio Transport Guide

## Basic Concepts

Stdio Transport is a communication method in the MCP protocol that uses standard input/output streams. This method is particularly suitable for command-line tools and local development testing scenarios.

## Server Implementation

In `src/stdio/server.ts`, we implement communication based on standard input and output using `StdioServerTransport`:

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

async function main() {
  // Create an MCP server
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
  });

  // Add an addition tool
  server.tool("add",
    { a: z.number(), b: z.number() },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(a + b) }]
    })
  );

  // Add a dynamic greeting resource
  server.resource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    async (uri, { name }) => ({
      contents: [{
        uri: uri.href,
        text: `Hello, ${name}!`
      }]
    })
  );

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(`Server started (PID: ${process.pid})`);
}

main().catch((error) => {
  console.error(`Fatal error running server (PID: ${process.pid}):`, error);
  if (!process.exitCode) {
    process.exit(1);
  }
});
```

## Client Implementation

In `src/stdio/client.ts`, we implement the client using `StdioClientTransport`:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx tsx",
  args: ["src/index.ts"],
});

const client = new Client({
  name: "example-client",
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
```

## Testing Methods

### Using the Inspector Tool

It's recommended to use the official `@modelcontextprotocol/inspector` tool for testing:

First, build the project:

```bash
pnpm build
```

Then run the following command:

```bash
npx @modelcontextprotocol/inspector node dist/stdio/server.js
```

Test the methods and resources in the interface:

* `add` method
  
![alt text](image/1744361248996.png)

* `resource`

![alt text](image/1744361365755.png)

### Running the Client Directly

You can also test by running the client program directly:

```bash
npx tsx src/stdio/client.ts
```

Example output for testing the add tool:
```
Testing add tool:
4 + 4 = { content: [ { type: 'text', text: '8' } ] }
```

Example output for testing the greeting resource:
```
Testing greeting resource:
Greeting: { contents: [ { uri: 'greeting://Lucy', text: 'Hello, Lucy!' } ] }
```

### vscode github copilot configuration for our MCP service

Create a new `.vscode/mcp.json` file:

```
// Example .vscode/mcp.json
{
    "servers": {
        // "my-mcp-server-42f01a96" is the server ID, which is a unique identifier for the server.
        // The server ID is used to identify the server in the MCP extension and in the MCP CLI.
        "my-mcp-server-42f01a96": {
            "type": "stdio",
            "command": "npx",
            "args": [
                "tsx",
                "E:/dev_workspace/mcp_workspace/typescript-mcp-demo/src/stdio/server.ts"
            ]
        }
    }
}
```

* **`type: "stdio"`**: Specifies the communication method as standard input/output streams, suitable for locally running MCP services.
* **`command: "npx"`**: Uses the `npx` command to run the specified program. `npx` is a Node.js tool for executing locally installed packages without global installation.
* **`args`**: Arguments passed to `npx`:
	- **`"tsx"`**: Uses the `tsx` tool to directly run TypeScript files without pre-compilation. `tsx` is based on `esbuild`, supports modern TypeScript and ESM modules, and performs better than traditional `ts-node`.
	- **`"xxx/src/stdio/server.ts"`**: Specifies the path to the TypeScript file to run, which is the entry point of your MCP service.

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31EDNV5FSXGbta3wlZw3r8qyfhEYYWSDhchhtKd9glGhh1g7XFTghdgXNA/640?wx_fmt=png&from=appmsg)

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31ED5RhpAPxb0PTMGB4uwvgZD52CvQgZkEdoNxHf1s85mlVgvkIRibksoGQ/640?wx_fmt=png&from=appmsg)

Trigger MCP tool functions using the # symbol, for example: #add

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31EDk5lOM6Ryo9YywMbWG7eVN1ia2akuo3qaNxvQh3krt7jLlUibpGPmsoIg/640?wx_fmt=png&from=appmsg)

Click continue, and the MCP plugin will automatically calculate the result

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31ED7NaSQZ2Jic4D0YicZMHYkgzTdXrDbFU3f3Mz4Pjku7nXqxE6SckMib12g/640?wx_fmt=png&from=appmsg)

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31ED70a6ib6xzo5EWfojGZAUdX1KmW8DH23DEF3S9fYD6Be93ZfEJbHxcyw/640?wx_fmt=png&from=appmsg)