# Server-Sent Events (SSE) Transport Guide

## Basic Concepts

Server-Sent Events (SSE) is a standard that enables servers to push data to web clients over HTTP connections. It's particularly useful for real-time updates and streaming data. In the MCP protocol, SSE transport provides a way to establish persistent connections between clients and servers.

## Server Implementation

In `src/sse/server.ts`, we implement an SSE-based server using `SseServerTransport`:

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SseServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

async function main() {
  // Create an MCP server instance
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
  });

  // Register the 'add' tool
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

  // Start the SSE server on port 3000
  const transport = new SseServerTransport({ port: 3000 });
  await server.connect(transport);
  console.log("Server started on port 3000");
}

main().catch(console.error);
```

## Testing Methods

### Using the Inspector Tool

First, build the project:

```bash
pnpm build
```

Then start the server:

```bash
npx tsx src/sse/server.ts
```

Use the inspector tool to test the server:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000
```

Test the methods and resources in the interface:

![SSE Test Interface](image/sse_1744440828533.png)

Testing Results:

![SSE Test Results](image/sse_1744440885070.png)

### VS Code Configuration

To use the SSE transport with VS Code GitHub Copilot, create or modify `.vscode/mcp.json`:

```jsonc
{
    "servers": {
        "my-mcp-server-42f01a96": {
            "type": "sse",
            "url": "http://localhost:3001"
        }
    }
}
```

Key configuration parameters:
* **`type: "sse"`**: Specifies SSE as the transport method
* **`url`**: The URL where your SSE server is running

After configuring, you can use the MCP tools directly in VS Code with the #command syntax.