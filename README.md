# MCP Protocol SDK Demo

This project demonstrates how to use the MCP (Model Context Protocol) SDK to implement client-server communication. It includes examples of different transport methods:

1. [Stdio Transport](./stdio.md): Using standard input/output streams
2. [Server-Sent Events (SSE)](./sse.md): Using HTTP-based SSE for real-time communication
3. [OpenAI Call](./openai_call.md): Using OpenAI's API

## Project Setup

1. Install dependencies
```bash
pnpm install
```

2. Build the project
```bash
pnpm build
```

## Examples

Each transport method has its own example with detailed documentation:

- Check [stdio.md](./stdio.md) for Stdio transport examples
- Check [sse.md](./sse.md) for SSE transport examples
- Check [openai_call.md](./openai_call.md) for OpenAI API integration examples

## Testing

You can use the `@modelcontextprotocol/inspector` tool to test your MCP server:

```bash
npx @modelcontextprotocol/inspector [command]
```

Replace `[command]` with the appropriate command for your transport method.