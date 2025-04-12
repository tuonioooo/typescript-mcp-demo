# Model Context Protocol (MCP) TypeScript Demo

This is a TypeScript example project based on the Model Context Protocol (MCP), demonstrating how to create a simple MCP server with basic tools and resources functionality.

## Language / 语言
- [English (Default)](#english)
- [简体中文](#简体中文)


## Features

- Provides a simple addition tool
- Provides a dynamic greeting resource
- Developed with TypeScript
- Supports standard input/output communication

## Documentation

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript SDK Documentation
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - MCP Service Testing Tool Documentation
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP Protocol Specification

## Requirements

- Node.js >= 20.10.0
- pnpm >= 8.0.0

## Installation

1. Install dependencies:

```bash
pnpm i
```

2. Build the project:

```bash
pnpm run build
```

The compiled files will be output to the `dist` directory.

## Examples

* For details about standard input/output (stdio) transport, please refer to [Stdio Transport](stdio.md).
* For remote servers using Server-Sent Events (SSE) endpoints and starting a web server with separate endpoints, refer to [HTTP with SSE](sse.md)
* [OpenAI Integration with Custom MCP Tools Guide](openai_call.md)

## Developing New Features

To add new tools or resources in `src/index.ts`:

1. Use `server.tool()` to add new tools
2. Use `server.resource()` to add new resources
3. Define input parameter types using Zod
4. Implement the corresponding processing logic
5. Create corresponding test case files

## Troubleshooting

If you encounter issues:

1. Ensure all dependencies are correctly installed
2. Check compilation output for errors
3. Verify test case JSON format is correct
4. Check process input/output configuration

## Notes

- Make sure to use compiled JavaScript files (in the `dist` directory) for testing
- Use the `@modelcontextprotocol/inspector` tool for testing
- Follow JSON-RPC 2.0 specification when writing requests
- Handle asynchronous operations and error cases properly