# Stdio Transport 使用说明

## 基本概念

Stdio Transport 是 MCP 协议中的一种传输方式，通过标准输入/输出流进行通信。这种方式特别适合命令行工具和本地开发测试场景。

## 服务端实现

在 `src/stdio/server.ts` 中，我们使用 `StdioServerTransport` 来实现基于标准输入输出的通信：

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

## 客户端实现

在 `src/stdio/client.ts` 中，我们使用 `StdioClientTransport` 来实现客户端：

```ts
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

## 测试方法

### 使用 Inspector 工具

推荐使用官方提供的 `@modelcontextprotocol/inspector` 工具进行测试：

先build

```bash
pnpm build
```

运行如下命令：

```bash
npx @modelcontextprotocol/inspector node dist/stdio/server.js
```

在界面中操作方法和资源

* `add` 方法
  
![alt text](image/1744361248996.png)

* `resource`

![alt text](image/1744361365755.png)

### 直接运行客户端

也可以直接运行客户端程序进行测试：

```bash
npx tsx src/stdio/client.ts
```

测试 add 工具输出示例：
```
Testing add tool:
4 + 4 = { content: [ { type: 'text', text: '8' } ] }
```

测试 greeting 资源输出示例：
```
Testing greeting resource:
Greeting: { contents: [ { uri: 'greeting://Lucy', text: 'Hello, Lucy!' } ] }
```

### vscode github copilot 配置我们搭建的mcp服务

新建`.vscode/mcp.json` 文件

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

* **`type: "stdio"`**：指定通信方式为标准输入/输出流（Standard Input/Output），适用于本地运行的 MCP 服务。
* **`command: "npx"`**：使用 `npx` 命令运行后续指定的程序。`npx` 是 Node.js 提供的工具，用于执行项目中安装的包，避免全局安装。
* **`args`**：传递给 `npx` 的参数数组：
	- **`"tsx"`**：使用 `tsx` 工具直接运行 TypeScript 文件，无需预先编译。`tsx` 基于 `esbuild`，支持现代 TypeScript 和 ESM 模块，性能优于传统的 `ts-node`。
	- **`"xxx/src/stdio/server.ts"`**：指定要运行的 TypeScript 文件路径，即您的 MCP 服务的入口文件。

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31EDNV5FSXGbta3wlZw3r8qyfhEYYWSDhchhtKd9glGhh1g7XFTghdgXNA/640?wx_fmt=png&from=appmsg)

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31ED5RhpAPxb0PTMGB4uwvgZD52CvQgZkEdoNxHf1s85mlVgvkIRibksoGQ/640?wx_fmt=png&from=appmsg)

通过#触发MCP工具函数名称，示例是：#add

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31EDk5lOM6Ryo9YywMbWG7eVN1ia2akuo3qaNxvQh3krt7jLlUibpGPmsoIg/640?wx_fmt=png&from=appmsg)

点击continue，就会自动调用MCP插件计算结果

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31ED7NaSQZ2Jic4D0YicZMHYkgzTdXrDbFU3f3Mz4Pjku7nXqxE6SckMib12g/640?wx_fmt=png&from=appmsg)

![](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhBWW38zE6CWAibVmNeJ31ED70a6ib6xzo5EWfojGZAUdX1KmW8DH23DEF3S9fYD6Be93ZfEJbHxcyw/640?wx_fmt=png&from=appmsg)
