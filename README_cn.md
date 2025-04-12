# typescript-mcp-demo

这是一个基于 Model Context Protocol (MCP) 的 TypeScript 示例项目，展示了如何创建一个简单的 MCP 服务器，包含基本的工具（tools）和资源（resources）功能。

## 功能特性

- 提供一个简单的加法工具（add tool）
- 提供一个动态问候资源（greeting resource）
- 使用 TypeScript 开发
- 支持标准输入/输出通信

## 相关文档

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - 官方 TypeScript SDK 文档
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - MCP 服务测试工具文档
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议规范文档

## 环境要求

- Node.js >= 20.10.0
- pnpm >= 8.0.0



## 安装步骤

1. 安装依赖：

```bash
pnpm i
```

2. 编译项目

```bash
pnpm run build
```

编译后的文件将输出到 `dist` 目录。

## 示例

* 有关标准输入输出 (stdio) 传输方式的详细信息，请参考 [stdio 传输说明](stdio_cn.md)。
* 对于远程服务器，使用服务器发送事件（SSE）端点和单独的端点启动web服务器，请参考[HTTP with SSE](sse_cn.md)
* [OpenAI 与 自定义的MCP工具集成指南](openai_call_cn.md)

## 开发新功能

要添加新的工具或资源，请在 `src/index.ts` 中：

1. 使用 `server.tool()` 添加新工具
2. 使用 `server.resource()` 添加新资源
3. 使用 Zod 定义输入参数的类型
4. 实现相应的处理逻辑
5. 创建对应的测试用例文件

## 故障排除

如果遇到问题：

1. 确保所有依赖都已正确安装
2. 检查编译输出是否有错误
3. 验证测试用例 JSON 格式是否正确
4. 检查进程输入输出是否正确配置

## 注意事项

- 确保测试时使用编译后的 JavaScript 文件（在 `dist` 目录中）
- 使用 `@modelcontextprotocol/inspector` 工具进行测试
- 遵循 JSON-RPC 2.0 规范编写请求
- 正确处理异步操作和错误情况